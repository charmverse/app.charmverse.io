import { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { uid } from 'lib/utilities/strings';
import { createWorkspace, SpaceCreateInput } from 'lib/spaces/createSpace';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { getFilenameWithExtension } from 'lib/utilities/getFilenameWithExtension';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

/*****
 * NOTE: This script creates new users and spaces for Optimism grants proposal projects.
 * It also updates mixpanel profiles so make sure to have prod mixpanel api key set in .env
 */

const FILE_INPUT_PATH = './op-projects-input-15.csv';
const FILE_OUTPUT_PATH = './op-projects-15.csv';

type ProjectData = {
  proposalTitle: string;
  twitter: string;
  authorTwitter: string;
  space: Space;
  spaceImageUrl: string | null;
  owner: string;
}

type CsvInputRow = {
  Title: string;
  SpaceName: string;
  username: string;
  createdBy: string;
  'Project Twitter': string;
  status: string;
  createdAt: string;
  'Author Twitter': string;
  twitterUsername: string;
  avatarUrl: string;
};

type CsvOutputRow = {
  'proposal_title': string;
  'space_id': string
  'space_name': string;
  'project_twitter': string;
  'author_twitter': string;
  'owner': string;
  'space_url': string;
  'join_url': string;
  'space_image_url': string;
  'created_date': string;
};

async function importProjects() {
  const importedNames = getImportedProjectNames();
  const projectsData = getProjectsSeedData();

  for (const projectDetails of projectsData) {
    const { Title: projectName, SpaceName: spaceName, createdBy: adminId, avatarUrl: logo, twitterUsername: twitter, 'Author Twitter': authorTwitter } = projectDetails;

    const proposalTitle = projectName.replace(/(^"|"$)/g, '');
    const spaceImageUrl = logo?.replace(/[\n\r]/g, '');

    if (importedNames.includes(proposalTitle)) {
      console.log('🟡 Already imported, skipping', proposalTitle);
      continue;
    }

    if (projectDetails !== null) {
      // temp id for local tests
      const users = await createSpaceUsers({ projectTitle: proposalTitle, adminId } );

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
          name: spaceName.trim().replace(/(^"|"$)/g, ''),
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

async function createSpaceUsers({projectTitle, adminId }: { projectTitle: string, adminId?: string }) {
  if (!projectTitle) {
    return null;
  }

  let adminUserId = adminId || null;

  // if admin was provided, check if user exists first
  if (adminUserId) {
    const user = await prisma.user.findUnique({ where: { id: adminUserId } });

    if (!user) {
      adminUserId = null;
    }
  }

  if (!adminUserId) {
    // Find user who created grant proposal
    const page = await prisma.page.findFirst({
      where: { title: { startsWith: projectTitle }, type: 'proposal' },
      include: { author: true }
    });

    adminUserId = page?.author.id || null;
  }

  if (!adminUserId) {
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

  return { adminUserId, botUser };
}

function getCsvData<T>(path: string): T[] {
  try {
    const content = readFileSync(path).toString();
    const records = parse(content, { columns: true }) as T[];

    return records;
  } catch (e) {}

  return [];
}

function getProjectsSeedData() {
  return getCsvData<CsvInputRow>(FILE_INPUT_PATH);
}

function getImportedProjectsData() {
  return getCsvData<CsvOutputRow>(FILE_OUTPUT_PATH);
}

function getImportedProjectNames() {
  const data = getImportedProjectsData();
  const names = data
    .map((row) => {
      return row.proposal_title || '';
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
  ]
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
    ];

    return infoRow
  });


  const csvString = stringify(csvData, {  header: isEmpty, columns: getCsvHeader()  });

  if (csvData.length) {
    appendFileSync(FILE_OUTPUT_PATH, csvString);
  }
}


importProjects();
