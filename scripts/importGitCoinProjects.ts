import { AlchemyProvider } from "@ethersproject/providers";
import { Space } from "@prisma/client";
import { getProjectRegistryContract } from "lib/gitcoin/getProjectRegistryContract";
import { getProjectDetails, GitcoinProjectDetails } from "lib/gitcoin/getProjectDetails";
import { prisma } from '@charmverse/core';
import { uid } from 'lib/utilities/strings';
import { createUserFromWallet } from "lib/users/createUser";
import { createWorkspace, SpaceCreateInput } from "lib/spaces/createSpace";
import { updateTrackGroupProfile } from "lib/metrics/mixpanel/updateTrackGroupProfile";
import { trackUserAction } from "lib/metrics/mixpanel/trackUserAction";
import { appendFileSync, readFileSync } from 'fs';
import { getIpfsFileUrl } from "lib/ipfs/fetchFileByHash";
import { getUserS3FilePath, uploadUrlToS3 } from "lib/aws/uploadToS3Server";
import { getFilenameWithExtension } from "lib/utilities/getFilenameWithExtension";

/*****
 * NOTE: This script creates new users and spaces for Gitcoin projects.
 * It also updates mixpanel profiles so make sure to have prod mixpanel api key set in .env
 */

const START_ID = 650;
const CHAIN_ID = 1;

const provider = new AlchemyProvider(CHAIN_ID, process.env.ALCHEMY_API_KEY);
const projectRegistry = getProjectRegistryContract({ providerOrSigner: provider, chainId: CHAIN_ID });
const FILE_PATH = './gitcoin-projects.csv';
const HOMEPAGE_TITLE = 'Information Hub'

async function getProjectCount() {
  const projectsCount = await projectRegistry.projectsCount();
  console.log('🔥 number of projects', projectsCount.toNumber());

  return projectsCount.toNumber();
}

type ProjectData = {
  projectDetails: GitcoinProjectDetails;
  space: Space;
  spaceImageUrl: string | null;
  bannerUrl: string | null;
}

async function importGitCoinProjects() {
  const importedIds = getImportedProjcetIds();
  const startProjectId = START_ID;
  const projectsCount = await getProjectCount();
  const projectsData: ProjectData[] = [];

  for (let i = startProjectId; i < projectsCount; i++) {
    console.log('🔥 Importing project', i);

    if (importedIds.includes(i)) {
      console.log('🟡 Already imported, skipping', i);
      continue;
    }

    const projectDetails = await getProjectDetails({ chainId: CHAIN_ID, projectId: i, provider });
    if (projectDetails !== null) {
      const name = projectDetails.metadata.title;
      const users = await createSpaceUsers([...projectDetails.owners]);

      if (users !== null) {
        const { botUser, adminUserId, extraAdmins} = users;

        let spaceImage: string | null = null
        // upload space image from ipfs to s3
        if (projectDetails.metadata.logoImg) {
          const spaceImageUrl = getIpfsFileUrl(projectDetails.metadata.logoImg);
          const pathInS3 = getUserS3FilePath({ userId: adminUserId, url: getFilenameWithExtension(spaceImageUrl) });
          try {
            const { url } = await uploadUrlToS3({ pathInS3, url: spaceImageUrl });
            spaceImage = url;
          } catch (error) {
            console.log('🔥', `error uploading space image ${projectDetails.projectId}`, error);
          }
        }

        // Create workspace
        const spaceData: SpaceCreateInput = {
          name,
          spaceImage,
          updatedBy: botUser.id,
        };

        const space = await createWorkspace({
          spaceData,
          userId: adminUserId,
          extraAdmins: [...extraAdmins, botUser.id],
          createSpaceTemplate: 'gitcoin',
          skipTracking: true
        });
        console.log('🟢 Created space for project', i, space.id);

        const bannerUrl = await updateHomepageBanner({ space, bannerIpfsHash: projectDetails.metadata.bannerImg, projectId: projectDetails.projectId });

        // mark space as created from gitcoin in mixpanel
        await updateTrackGroupProfile(space, 'gitcoin');
        trackUserAction('create_new_workspace', { userId: adminUserId, spaceId: space.id, template: 'default', source: 'gitcoin' });
        [adminUserId, ...extraAdmins].forEach((userId) => trackUserAction('join_a_workspace', { spaceId: space.id, userId, source: 'gitcoin-growth-hack' }));

        const projectInfo = { projectDetails, space, spaceImageUrl: spaceImage, bannerUrl }
        projectsData.push(projectInfo);

        exportDataToCSV([projectInfo]);
        console.log('🟢 Finished Importing project', i);
      } else {
        console.log('🟡 Failed to create users for project, skipping', i);
      }
    } else {
      console.log('🟡 Failed to load project details', i);
    }
  }

  console.log('🔥 imported projects count:', projectsData.length);

}

async function updateHomepageBanner({ space, bannerIpfsHash, projectId }: { space: Space, bannerIpfsHash: string | null, projectId: number}) {
    if (!bannerIpfsHash) {
      return null;
    }

    const bannerUrl = getIpfsFileUrl(bannerIpfsHash);
    const pathInS3 = getUserS3FilePath({ userId: space.createdBy, url: getFilenameWithExtension(bannerUrl) });

    try {
      const { url } = await uploadUrlToS3({ pathInS3, url: bannerUrl });
      // find page by title and update banner
      const page = await prisma.page.findFirst({
        where: {
          title: HOMEPAGE_TITLE,
          spaceId: space.id
        }
      });

      if (page) {
        await prisma.page.update({
          where: { id: page.id },
          data: { headerImage: url }
        });
      }

      return url;
    } catch (error) {
      console.log('🔥', `error uploading page banner image ${projectId}`, error);
      return null;
    }

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

function getImportedProjcetIds() {
  try {
    const content = readFileSync(FILE_PATH).toString();
    const rows = content.split('\n');


    const ids = rows.map(row => {
      const cols = row?.split(';') || [];
      const projectId = Number(cols[0]) || null;
      return projectId
    }).filter(id => id !== null);

    console.log('🔥 imported projects count', ids.length);

    return ids;
 } catch (e) {

 }

 return [];
}

function exportDataToCSV(data: ProjectData[]) {
  let isEmpty = true;
  try {
     isEmpty = !readFileSync(FILE_PATH).length;
  } catch (e) {

  }

  const csvData = data.map(({ projectDetails, space, bannerUrl, spaceImageUrl }) => {
    const { metadata, owners, metadataUrl, projectId } = projectDetails;
    const {  description, website, projectTwitter } = metadata;
    const { name, domain,id } = space;

    const spaceUrl = `https://app.charmverse.io/${domain}`;
    const joinUrl = `https://app.charmverse.io/join?domain=${domain}`

    const infoRow =  [projectId, id, name, projectTwitter, website, owners.join(','), spaceUrl, joinUrl, spaceImageUrl, bannerUrl, metadataUrl].join(';');
    return ('\n').concat(infoRow)
  });

  // add header if file is empty
  if (isEmpty) {
    csvData.unshift(['projectId', 'spaceId', 'name', 'twitter', 'website', 'owners', 'spaceUrl', 'joinUrl', 'logoUrl', 'bannerUrl', 'metadataUrl'].join(';'));
  }

  if (csvData.length) {
    appendFileSync(FILE_PATH, csvData.join('\n'));
  }
}

// getImportedProjcetIds()
// getProjectCount();

// importGitCoinProjects();