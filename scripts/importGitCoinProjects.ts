import { AlchemyProvider } from '@ethersproject/providers';
import { Space } from '@charmverse/core/prisma';
import { getProjectRegistryContract } from 'lib/gitcoin/getProjectRegistryContract';
import { getProjectDetails, GitcoinProjectDetails, ProjectMetadata } from 'lib/gitcoin/getProjectDetails';
import { prisma } from '@charmverse/core/prisma-client';
import { uid } from 'lib/utilities/strings';
import { createUserFromWallet } from 'lib/users/createUser';
import { createWorkspace, SpaceCreateInput } from 'lib/spaces/createSpace';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { getIpfsFileUrl } from 'lib/ipfs/fetchFileByHash';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { getFilenameWithExtension } from 'lib/utilities/getFilenameWithExtension';
import {  parse, stringify } from 'csv/sync';
import { GET } from '@charmverse/core/http';


/*****
 * NOTE: This script creates new users and spaces for Gitcoin projects.
 * It also updates mixpanel profiles so make sure to have prod mixpanel api key set in .env
 */

const START_ID = 950;
const CHAIN_ID = 1;

const provider = new AlchemyProvider(CHAIN_ID, process.env.ALCHEMY_API_KEY);
const projectRegistry = getProjectRegistryContract({ providerOrSigner: provider, chainId: CHAIN_ID });
const FILE_PATH = './gitcoin-projects-fixed.csv';
const HOMEPAGE_TITLE = 'Information Hub';

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
};

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
      const projectInfo = await importProjectFromDetails(projectDetails);
      if (projectInfo) {
        projectsData.push(projectInfo);
        exportDataToCSV([projectInfo]);
      }

    } else {
      console.log('🟡 Failed to load project details', i);
    }
  }

  console.log('🔥 imported projects count:', projectsData.length);
}

async function importProjectFromDetails(projectDetails: GitcoinProjectDetails) {
  const name = projectDetails.metadata.title;
  const users = await createSpaceUsers([...projectDetails.owners]);
  const projectLogInfo = projectDetails.projectId || projectDetails.metadata.title;

  if (users !== null) {
    const { botUser, adminUserId, extraAdmins } = users;

    let spaceImage: string | null = null;
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
      origin: 'gitcoin'
    };

    const space = await createWorkspace({
      spaceData,
      userId: adminUserId,
      extraAdmins: [...extraAdmins, botUser.id],
      spaceTemplate: 'templateGitcoin'
    });
    console.log('🟢 Created space for project', projectLogInfo, space.id);

    const bannerUrl = await updateHomepageBanner({
      space,
      bannerIpfsHash: projectDetails.metadata.bannerImg,
      projectId: Number(projectDetails.projectId)
    });

    // mark space as created from gitcoin in mixpanel
    await updateTrackGroupProfile(space, 'gitcoin');

    const projectInfo = { projectDetails, space, spaceImageUrl: spaceImage, bannerUrl };

    console.log('🟢 Finished Importing project', projectLogInfo);
    return projectInfo
  } else {
    console.log('🟡 Failed to create users for project, skipping', projectLogInfo);
  }
}

async function updateHomepageBanner({
  space,
  bannerIpfsHash,
  projectId
}: {
  space: Space;
  bannerIpfsHash: string | null;
  projectId: number;
}) {
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

  const userPromises = owners.map(async (owner) =>
    createUserFromWallet(
      { address: owner, skipTracking: true },
      {
        signupSource: 'gitcoin-project',
        signupCampaign: 'gitcoin-growth-hack'
      }
    )
  );

  const userIds = (await Promise.all(userPromises)).map((user) => user.id);
  const [author, ...users] = userIds;

  return { adminUserId: author, extraAdmins: [...users], botUser };
}

function getImportedProjectsData(filePath = FILE_PATH) {
  try {
    const content = readFileSync(filePath).toString();
    const rows: string[][] = parse(content, { skip_empty_lines: true, from_line: 2 });
    return rows
  } catch (e) {
    console.log('🔥', e);
  }

  return [];
}

function getImportedProjcetIds() {
  const data = getImportedProjectsData();
  const ids = data
    .map((cols) => {
      // col 0 - gitcoin project id
      const projectId = Number(cols[0]) || null;
      return projectId;
    })
    .filter((id): id is number => id !== null);

  console.log('🔥 imported projects count', ids.length);

  return ids;
}

function getImportedProjcetSpaceIds() {
  const data = getImportedProjectsData();

  return data
    .map((cols) => {
      // col 1 - gitcoin project space id
      const projectId = cols[1] || null;
      return projectId;
    })
    .filter((id): id is string => id !== null);
}

function getCsvHeader(asString = false) {
  const header =  [
    'gitcoin_project_id',
    'gitcoin_space_id',
    'space_name',
    'project_twitter',
    'website',
    'owners',
    'space_url',
    'join_url',
    'space_image_url',
    'banner_url',
    'metadata_url',
    'created_date'
  ];

  return header;
}

function exportDataToCSV(data: ProjectData[], filePath = FILE_PATH,) {
  let isEmpty = true;
  try {
    isEmpty = !readFileSync(filePath).length;
  } catch (e) {}

  const csvData = data.map(({ projectDetails, space, bannerUrl, spaceImageUrl }) => {
    const { metadata, owners, metadataUrl, projectId } = projectDetails;
    const { description, website, projectTwitter, createdAt } = metadata;
    const { name, domain, id } = space;

    const spaceUrl = `https://app.charmverse.io/${domain}`;
    const joinUrl = `https://app.charmverse.io/join?domain=${domain}`;
    const createdDate = new Date(createdAt).toLocaleDateString('en-US') || '??';

    const infoRow = [
      projectId,
      id,
      name,
      projectTwitter,
      website,
      owners.join(','),
      spaceUrl,
      joinUrl,
      spaceImageUrl,
      bannerUrl,
      metadataUrl,
      createdDate
    ];

    return infoRow;
  });

  // add header if file is empty
  if (isEmpty) {
    csvData.unshift(getCsvHeader(false));
  }

  if (csvData.length) {
    const content = stringify(csvData, { header: false });
    appendFileSync(filePath, content);
  }
}

async function updateSpaceOrigins() {
  const spaceIds = getImportedProjcetSpaceIds();
  await prisma.space.updateMany({
    where: { id: { in: spaceIds } },
    data: { origin: 'gitcoin' }
  });
}

async function importApprovedRoundProjects() {
 const url = 'https://indexer-production.fly.dev/data/10/rounds/0x984e29dCB4286c2D9cbAA2c238AfDd8A191Eefbc/applications.json';
 const data: any[] = await GET(url, {});

  const importedOldRoundsProjects = getImportedProjectsData();
  const importedProjects = getImportedProjectsData('./gitcoin-round-10.csv');

  const approvedProjects = data.filter((project) => project.status === 'APPROVED');

  for (const project of approvedProjects) {
    const projectDetails = getOffChainProjectDetails(project);

    if (projectDetails !== null) {
      if (importedProjects.some((projectData) => projectData[3] === projectDetails.metadata.projectTwitter)) {
        console.log('🟡 Already imported, skipping', projectDetails.metadata.title, projectDetails.projectId);
        continue;
      }

      const importedProjectData = importedOldRoundsProjects.find((projectData) => projectData[3].toLowerCase() === projectDetails.metadata.projectTwitter.toLowerCase())
      if (importedProjectData) {
        console.log('🟡 Already imported in old round (verified by twitter), skipping', projectDetails.metadata.projectTwitter);

        const content = stringify([importedProjectData], { header: false });
        appendFileSync('./gitcoin-round-10.csv', content);

        continue;
      }

      const projectInfo = await importProjectFromDetails(projectDetails);

      if (projectInfo) {
        exportDataToCSV([projectInfo], './gitcoin-round-10.csv');
      }

    } else {
      console.log('🟡 Failed to load project details', data);
    }
  }
}

function getOffChainProjectDetails(data: {
  projectId: string,
  metadata: {
    application: {
      recipient: string,
      project: ProjectMetadata & { metaPtr: { pointer: string } }
    }
} }): GitcoinProjectDetails | null {
    try {
    const { metadata, projectId } = data;
    const { application } = metadata;

    const projectDetails = {
      projectId,
      metadata: application.project,
      owners: [application.recipient],
      metadataUrl: getIpfsFileUrl(application.project.metaPtr.pointer)
    };

    return projectDetails;
  } catch (e) {
    console.log('🔥', 'Failed to get offchain project details', data);
    return null
  }
}

// getImportedProjcetIds()
// getImportedProjcetSpaceIds()
// getProjectCount();

// updateSpaceOrigins();

// importGitCoinProjects();
// getImportedProjectsData();
importApprovedRoundProjects();