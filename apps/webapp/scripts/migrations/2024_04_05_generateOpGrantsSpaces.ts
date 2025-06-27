// @ts-nocheck
import { log } from '@packages/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { parse } from 'csv-parse/sync';
import { addCharms } from 'lib/charms/addCharms';
import { updateTrackGroupProfile } from '@packages/metrics/mixpanel/updateTrackGroupProfile';
import { createWorkspace } from 'lib/spaces/createSpace';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { unparse } from 'papaparse';

const spaceDomain = 'concrete-floor-sailfish';
const FILE_INPUT_PATH = path.join(__dirname, 'op.csv');
const FILE_OUTPUT_PATH = path.join(__dirname, 'op-output.csv');

function getCsvData<T>(path: string): T[] {
  try {
    const content = readFileSync(path).toString();
    const records = parse(content, { columns: true }) as T[];

    return records;
  } catch (e) {}

  return [];
}

type ProjectData = {
  'Project Name': string;
  Twitter: string;
  'Won?': string;
};

type ExtractedProjectData = {
  'Project name': string;
  'Twitter handle': string;
  'Invite link': string;
  'Space id': string;
};

function extractTwitterUsername(twitterValue: string) {
  if (twitterValue.startsWith('@')) {
    return twitterValue.slice(1);
  } else if (twitterValue.startsWith('https://')) {
    const url = new URL(twitterValue);
    if (url.hostname === 'x.com' || url.hostname === 'x.com') {
      const [, username] = url.pathname.split('/');
      return username;
    }
  }

  return twitterValue;
}

export async function generateOpGrantSpaces() {
  const projectsData = getCsvData<ProjectData>(FILE_INPUT_PATH);
  const projectTitles: Set<string> = new Set();
  const uniqueProjectsData: ProjectData[] = [];

  for (const projectData of projectsData) {
    if (!projectTitles.has(projectData['Project Name'])) {
      projectTitles.add(projectData['Project Name']);
      uniqueProjectsData.push(projectData);
    }
  }

  const total = uniqueProjectsData.length;
  let current = 0;

  const extractedProjectsTitles = new Set<string>();
  const extractedProjectsData: ExtractedProjectData[] = [];

  let lastId = '';
  const batchSize = 100;

  while (true) {
    const proposals = await prisma.proposal.findMany({
      where: {
        id: {
          gt: lastId || undefined
        },
        space: {
          domain: spaceDomain
        },
        page: {
          type: 'proposal',
          createdAt: {
            gte: new Date('2024-01-01T00:00:00Z')
          }
        },
        status: 'published'
      },
      select: {
        id: true,
        form: {
          select: {
            formFields: {
              select: {
                id: true,
                name: true,
                answers: true
              }
            }
          }
        },
        createdBy: true,
        authors: {
          select: {
            userId: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      },
      take: batchSize
    });

    if (proposals.length === 0) {
      break;
    }

    lastId = proposals[proposals.length - 1].id;

    for (const proposal of proposals) {
      const projectNameField = proposal.form?.formFields.find((formField) =>
        formField.name.toLowerCase().startsWith('project name')
      );
      const projectTitle = (
        projectNameField?.answers.find((answer) => answer.proposalId === proposal.id)?.value as string
      )
        ?.replace(/[\p{Emoji}]/gu, '')
        .trim();
      const projectData = uniqueProjectsData.find((projectData) => projectData['Project Name'] === projectTitle);

      // If project title is not found in the CSV, or if it's already processed, or if it's not in the list of unique projects, or if the project data is not found, skip
      if (
        !projectTitle ||
        extractedProjectsTitles.has(projectTitle) ||
        !projectTitles.has(projectTitle) ||
        !projectData
      ) {
        current++;
        console.log(`Project ${current} of ${total} done.`);
        continue;
      }

      try {
        const authors = proposal.authors.map((author) => author.userId);
        const space = await createWorkspace({
          spaceData: {
            name: projectTitle,
            spaceImage: '',
            origin: spaceDomain
          },
          userId: proposal.createdBy,
          extraAdmins: authors,
          spaceTemplate: 'templateImpactCommunity'
        });
        await updateTrackGroupProfile(space, spaceDomain);
        extractedProjectsData.push({
          'Project name': projectTitle,
          'Invite link': `https://app.charmverse.io/join?domain=${space.domain}`,
          'Twitter handle': extractTwitterUsername(projectData['Twitter']) ?? '',
          'Space id': space.id
        });
        extractedProjectsTitles.add(projectTitle);
        await addCharms({
          amount: projectData['Won?'] === 'Yes' ? 10 : 2,
          recipient: {
            spaceId: space.id
          },
          actorId: proposal.createdBy
        });
      } catch (err) {
        log.error(`Error creating space for project ${projectTitle}`, err);
      } finally {
        current++;
        console.log(`Project ${current} of ${total} done.`);
      }
    }
  }

  appendFileSync(FILE_OUTPUT_PATH, unparse(extractedProjectsData));
}

generateOpGrantSpaces().then(() => console.log('Done'));
