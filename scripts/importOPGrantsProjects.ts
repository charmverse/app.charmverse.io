import { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { uid } from '@packages/utils/strings';
import { createWorkspace, SpaceCreateInput } from 'lib/spaces/createSpace';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { createOrGetUserFromWallet } from 'lib/users/createUser';
import { getProjectsImportData } from 'scripts/optimism/getRound3Projects';
import { DateTime } from 'luxon';
import { isTruthy } from 'lib/utils/types';
import { getFilenameWithExtension } from 'lib/utils/getFilenameWithExtension';

/*****
 * NOTE: This script creates new users and spaces for Optimism grants proposal projects.
 * It also updates mixpanel profiles so make sure to have prod mixpanel api key set in .env
 */

const FILE_INPUT_PATH = './op.csv';
const FILE_OUTPUT_PATH = './op-projects-round3.csv';
const IMPORT_TYPE = 'api'; // 'api' | 'csv'
const EXTRA_BLOCK_QUOTA = 20; //20k blocks

type ProjectData = {
  proposalTitle: string;
  twitter: string;
  authorTwitter: string;
  space: Space;
  spaceImageUrl: string | null;
  owner: string;
  website?: string;
};

export type ProjectInputRow = {
  Title: string;
  SpaceName: string;
  username: string;
  // CV admin user id
  createdBy: string;
  'Project Twitter': string;
  status: string;
  createdAt: string;
  'Author Twitter': string;
  twitterUsername: string;
  avatarUrl: string;
  // wallet address of the admin
  adminAddress?: string;
  website?: string;
};

type CsvOutputRow = {
  proposal_title: string;
  space_id: string;
  space_name: string;
  project_twitter: string;
  author_twitter: string;
  owner: string;
  space_url: string;
  join_url: string;
  space_image_url: string;
  created_date: string;
};

async function importProjects() {
  const importedNames = getImportedProjectNames();
  const importedSpaceNames = getImportedProjectSpaceNames();
  const projectsData = await getProjectsSeedData(IMPORT_TYPE);

  for (const projectDetails of projectsData) {
    const {
      Title: projectName,
      SpaceName: spaceName,
      createdBy: adminId,
      avatarUrl: logo,
      twitterUsername: twitter,
      'Author Twitter': authorTwitter,
      adminAddress,
      website
    } = projectDetails;
    const owners = [adminAddress].filter(isTruthy);

    const proposalTitle = projectName.replace(/(^"|"$)/g, '');
    const spaceImageUrl = logo?.replace(/[\n\r]/g, '');

    if (proposalTitle && importedNames.includes(proposalTitle)) {
      console.log('🟡 Already imported, skipping', proposalTitle);
      continue;
    }

    if (spaceName && importedSpaceNames.includes(spaceName)) {
      console.log('🟡 Space Name already imported, skipping', spaceName);
      continue;
    }

    if (projectDetails !== null) {
      // temp id for local tests
      const users = await createSpaceUsers({ projectTitle: proposalTitle, adminId, owners });

      if (users !== null) {
        const { botUser, adminUserId, owners } = users;

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
          extraAdmins: [botUser.id, ...owners],
          spaceTemplate: 'templateOPGrant'
        });

        console.log('🟢 Created space for project', spaceName, space.id);

        // mark space as created from gitcoin in mixpanel
        await updateTrackGroupProfile(space, 'optimism-grants');

        await prisma.additionalBlockQuota.create({
          data: {
            spaceId: space.id,
            blockCount: EXTRA_BLOCK_QUOTA,
            expiresAt: DateTime.local().plus({ years: 1 }).endOf('day').toJSDate()
          }
        });

        const projectInfo = {
          proposalTitle,
          twitter,
          authorTwitter,
          space,
          spaceImageUrl: spaceImage,
          owner: adminUserId,
          website
        };

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

async function createSpaceUsers({
  projectTitle,
  adminId,
  owners
}: {
  projectTitle: string;
  adminId?: string;
  owners?: string[];
}) {
  if (!projectTitle && !owners?.length) {
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

  let extraOwners: string[] = [];
  if (!adminUserId && owners?.length) {
    const userPromises = owners.map(async (owner) =>
      createOrGetUserFromWallet(
        { address: owner, skipTracking: true },
        {
          signupSource: 'optimism-project',
          signupCampaign: 'optimism-growth-hack'
        }
      )
    );

    const userIds = (await Promise.all(userPromises)).map(({ user }) => user.id);
    const [author, ...users] = userIds;
    adminUserId = author;
    extraOwners = users;
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

  return { adminUserId, botUser, owners: extraOwners };
}

function getCsvData<T>(path: string): T[] {
  try {
    const content = readFileSync(path).toString();
    const records = parse(content, { columns: true }) as T[];

    return records;
  } catch (e) {}

  return [];
}

async function getProjectsSeedData(type: 'api' | 'csv') {
  if (type === 'api') {
    return getProjectsImportData();
  }

  return getCsvData<ProjectInputRow>(FILE_INPUT_PATH);
}

function getImportedProjectsData() {
  return getCsvData<CsvOutputRow>(FILE_OUTPUT_PATH);
}

function getImportedProjectNames() {
  const data = getImportedProjectsData();

  const names = data.map((row) => {
    return row.proposal_title || '';
  });

  console.log('🔥 imported projects count', names.length);

  return names;
}

function getImportedProjectSpaceNames() {
  const data = getImportedProjectsData();
  const names = data.map((row) => {
    return row.space_name || '';
  });

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
    'created_date',
    'website'
  ];
}

function exportDataToCSV(data: ProjectData[]) {
  let isEmpty = true;
  try {
    isEmpty = !readFileSync(FILE_OUTPUT_PATH).length;
  } catch (e) {}

  const csvData = data.map(({ proposalTitle, space, spaceImageUrl, owner, twitter, authorTwitter, website }) => {
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
      createdDate,
      website
    ];

    return infoRow;
  });

  const csvString = stringify(csvData, { header: isEmpty, columns: getCsvHeader() });

  if (csvData.length) {
    appendFileSync(FILE_OUTPUT_PATH, csvString);
  }
}

importProjects();
