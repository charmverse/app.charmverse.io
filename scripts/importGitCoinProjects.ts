import { AlchemyProvider } from "@ethersproject/providers";
import { Space } from "@prisma/client";
import { getProjectRegistryContract } from "lib/gitcoin/contracts";
import { getProjectDetails, GitcoinProjectDetails } from "lib/gitcoin/getProjectDetails";
import { prisma } from 'db';
import { uid } from 'lib/utilities/strings';
import { createUserFromWallet } from "lib/users/createUser";
import { createWorkspace, SpaceCreateInput } from "lib/spaces/createSpace";
import { updateTrackGroupProfile } from "lib/metrics/mixpanel/updateTrackGroupProfile";
import { trackUserAction } from "lib/metrics/mixpanel/trackUserAction";
import { appendFileSync, readFileSync } from 'fs';
import { baseUrl } from "config/constants";

/*****
 * NOTE: This script creates new users and spaces for Gitcoin projects.
 * It also updates mixpanel profiles so make sure to have prod mixpanel api key set in .env
 */

export type GitcoinChainId = 1 | 5 | 10 | 250;

export const GITCOIN_SUPPORTED_CHAINS = [1, 5, 10, 250] as const;

export const PROJECT_REGISTRY_ADDRESSES: Record<GitcoinChainId, string> = {
  // MAINNET
  1: '0x03506eD3f57892C85DB20C36846e9c808aFe9ef4',
  // OPTIMISM
  10: '0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174',
  // FANTOM
  250: '0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174',
  // GOERLI
  5: '0x832c5391dc7931312CbdBc1046669c9c3A4A28d5'
};

const START_ID = 500;
const CHAIN_ID = 1;

const provider = new AlchemyProvider(CHAIN_ID, process.env.ALCHEMY_API_KEY);
const projectRegistry = getProjectRegistryContract({ providerOrSigner: provider, chainId: CHAIN_ID });
const FILE_PATH = './gitcoin-projects.csv';

async function getProjectCount() {
  const projectsCount = await projectRegistry.projectsCount();
  console.log('🔥 number of projects', projectsCount.toNumber());

  return projectsCount.toNumber();
}

type ProjectData = {
  projectDetails: GitcoinProjectDetails;
  space: Space;
}

async function importGitCoinProjects() {
  const projectsCount = await getProjectCount();
  const projectsData: ProjectData[] = [];

  for (let i = projectsCount - 2; i < projectsCount; i++) {
    const projectDetails = await getProjectDetails({ chainId: CHAIN_ID, projectId: i, provider });
    if (projectDetails !== null) {
      const name = projectDetails.metadata.title;
      const users = await createSpaceUsers(projectDetails.owners);

      if (users !== null) {
        const { botUser, adminUserId, extraAdmins} = users;
        // Create workspace
        const spaceData: SpaceCreateInput = {
          name,
          updatedBy: botUser.id,
        };

        const space = await createWorkspace({
          spaceData,
          userId: adminUserId,
          extraAdmins: [...extraAdmins, botUser.id],
          createSpaceTemplate: undefined, // TODO - ask for gitcoin template,
          skipTracking: true
        });

        // mark space as created from gitcoin in mixpanel
        await updateTrackGroupProfile(space, 'gitcoin');
        trackUserAction('create_new_workspace', { userId: adminUserId, spaceId: space.id, template: 'default', source: 'gitcoin' });
        [adminUserId, ...extraAdmins].forEach((userId) => trackUserAction('join_a_workspace', { spaceId: space.id, userId, source: 'gitcoin-growth-hack' }));

        projectsData.push({ projectDetails, space });
      }
    }
  }

  console.log('🔥 imported projects count:', projectsData.length);

  exportDataToCSV(projectsData);
}

async function createSpaceUsers(owners: string[]) {
  if (!owners?.length) {
    return null;
  }

  const botUser = await prisma.user.create({
    data: {
      username: 'Bot',
      isBot: true,
      identityType: 'RandomName',
      path: uid()
    }
  });

  const userPromises = owners.map(async (owner) => createUserFromWallet({ address: owner }, {
    signupSource: 'gitcoin-project',
    signupCampaign: 'gitcoin-growth-hack'
  }));

  const userIds =  (await Promise.all(userPromises)).map((user) => user.id);
  const [author, ...users] = userIds;

  return { adminUserId: author, extraAdmins: [...users], botUser };

}

function exportDataToCSV(data: ProjectData[]) {
  let isEmpty = true;
  try {
     isEmpty = !readFileSync(FILE_PATH).length;
  } catch (e) {

  }

  const csvData = data.map(({ projectDetails, space }) => {
    const { metadata, owners, metadataUrl, projectId } = projectDetails;
    const {  description, website, projectTwitter } = metadata;
    const { name, domain } = space;

    const spaceUrl = `https://app.charmverse.io/${domain}`;
    const joinUrl = `https://app.charmverse.io/join?domain=${domain}`

    return [projectId, name, projectTwitter,description, website, owners.join(','), spaceUrl, joinUrl, metadataUrl].join(';');
  });

  // add header if file is empty
  if (isEmpty) {
    csvData.unshift(['projectId', 'name', 'twitter', 'description', 'website', 'owners', 'spaceUrl', 'joinUrl', 'metadataUrl'].join(';'));
  }

  if (csvData.length) {
    appendFileSync(FILE_PATH, csvData.join('\n').concat('\n'));
  }
}

// importGitCoinProjects();
// getProjectCount();