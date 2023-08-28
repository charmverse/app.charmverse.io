import { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { uid } from 'lib/utilities/strings';
import { createWorkspace, SpaceCreateInput } from 'lib/spaces/createSpace';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { getFilenameWithExtension } from 'lib/utilities/getFilenameWithExtension';

/*****
 * NOTE: This script creates new users and spaces for Optimism grants proposal projects.
 * It also updates mixpanel profiles so make sure to have prod mixpanel api key set in .env
 */

const FILE_INPUT_PATH = './op-projects-input.csv';
const FILE_OUTPUT_PATH = './op-projects.csv';

type ProjectData = {
  proposalTitle: string;
  twitter: string;
  authorTwitter: string;
  space: Space;
  spaceImageUrl: string | null;
  owner: string;
}

async function importProjects() {
  const importedNames = getImportedProjectNames();
  const projectsData = getProjectsSeedData();

  for (const projectDetails of projectsData) {
    const [projectName, spaceName, twitter, authorTwitter, logo] = projectDetails;
    const proposalTitle = projectName.replace(/(^"|"$)/g, '');
    const spaceImageUrl = logo?.replace(/[\n\r]/g, '');

    if (importedNames.includes(proposalTitle)) {
      console.log('🟡 Already imported, skipping', proposalTitle);
      continue;
    }

    if (projectDetails !== null) {
      const users = await createSpaceUsers(proposalTitle);

      if (users !== null) {
        const { botUser, adminUserId } = users;

        let spaceImage: string | null = null;
        // upload space image from ipfs to s3
        if (spaceImageUrl) {
          const pathInS3 = getUserS3FilePath({ userId: adminUserId, url: getFilenameWithExtension(spaceImageUrl) });
          try {
            const { url } = await uploadUrlToS3({ pathInS3, url: spaceImageUrl });
            spaceImage = url;
          } catch (error) {
            console.log('🔥', `error uploading space image ${proposalTitle}`, spaceImageUrl, error);
          }
        }

        // Create workspace
        const spaceData: SpaceCreateInput = {
          name: spaceName.replace(/(^"|"$)/g, ''),
          spaceImage,
          updatedBy: botUser.id,
          origin: 'optimism-grants'
        };

        const space = await createWorkspace({
          spaceData,
          userId: adminUserId,
          extraAdmins: [botUser.id],
          spaceTemplate: 'templateOPGrant'
        });

        console.log('🟢 Created space for project', spaceName, space.id);

        // mark space as created from gitcoin in mixpanel
        await updateTrackGroupProfile(space, 'optimism-grants');

        const projectInfo = { proposalTitle, twitter, authorTwitter, space, spaceImageUrl: spaceImage, owner: adminUserId };

        exportDataToCSV([projectInfo]);
        console.log('🟢 Finished Importing project', spaceName);
      } else {
        console.log('🟡 Failed to create users for project, skipping', proposalTitle);
      }
    } else {
      console.log('🟡 Failed to load project details', spaceName);
    }
  }

  console.log('🔥 imported projects count:', projectsData.length);
}

async function createSpaceUsers(projectTitle: string) {
  if (!projectTitle) {
    return null;
  }

  // Find user who created grant proposal
  const page = await prisma.page.findFirst({
    where: { title: { startsWith: projectTitle }, type: 'proposal' },
    include: { author: true }
  });

  if (!page) {
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

  return { adminUserId: page.author.id, botUser };
}

function getCsvData(path: string) {
  try {
    const content = readFileSync(path).toString();
    const [_, ...rows] = content.split('\n');

    return rows.map((row) => row?.split(';') || []);
  } catch (e) {}

  return [];
}

function getProjectsSeedData() {
  return getCsvData(FILE_INPUT_PATH);
}

function getImportedProjectsData() {
  return getCsvData(FILE_OUTPUT_PATH);
}

function getImportedProjectNames() {
  const data = getImportedProjectsData();
  const names = data
    .map((cols) => {
      return cols[0] || '';
    })

  console.log('🔥 imported projects count', names.length);

  return names;
}

function getCsvHeader() {
  return [
    'proposal_title',
    'space_id',
    'space_name',
    'project_twitter',
    'author_twitter',
    'owner',
    'space_url',
    'join_url',
    'space_image_url',
    'created_date'
  ].join(';');
}

function exportDataToCSV(data: ProjectData[]) {
  let isEmpty = true;
  try {
    isEmpty = !readFileSync(FILE_OUTPUT_PATH).length;
  } catch (e) {}

  const csvData = data.map(({ proposalTitle, space, spaceImageUrl, owner, twitter, authorTwitter }) => {
    const { name, domain, id, createdAt } = space;

    const spaceUrl = `https://app.charmverse.io/${domain}`;
    const joinUrl = `https://app.charmverse.io/join?domain=${domain}`;
    const createdDate = new Date(createdAt).toLocaleDateString('en-US') || '??';

    const infoRow = [
      proposalTitle,
      id,
      name,
      twitter,
      authorTwitter,
      owner,
      spaceUrl,
      joinUrl,
      spaceImageUrl,
      createdDate
    ].join(';');
    return '\n'.concat(infoRow);
  });

  // add header if file is empty
  if (isEmpty) {
    csvData.unshift(getCsvHeader());
  }

  if (csvData.length) {
    appendFileSync(FILE_OUTPUT_PATH, csvData.join('\n'));
  }
}


importProjects();
