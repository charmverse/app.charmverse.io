import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { parse } from 'csv-parse/sync';
import { addCharms } from 'lib/charms/addCharms';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { createWorkspace } from 'lib/spaces/createSpace';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { unparse } from 'papaparse';

const spaceDomain = "op-grants";
const FILE_INPUT_PATH = path.join(__dirname, 'op.csv');
const FILE_OUTPUT_PATH = path.join(__dirname, 'op-output.csv');

function getCsvData<T>(path: string): T[] {
  try {
    const content = readFileSync(path).toString();
    const records = parse(content, { columns: true }) as T[];
    return records;
  } catch (e) {
  }

  return [];
}

type ProjectData = {
  'Project Name': string
  'Twitter': string
  'Won?': string
}

type ExtractedProjectData = {
  "Project name": string
  "Twitter handle": string
  "Invite link": string
}

function extractTwitterUsername(twitterValue: string) {
  if (twitterValue.startsWith('@')) {
    return twitterValue.slice(1);
  } else if (twitterValue.startsWith('https://')) {
    const url = new URL(twitterValue);
    if (url.hostname === 'twitter.com' || url.hostname === 'x.com') {
      const [,username] = url.pathname.split('/');
      return username.split("?")[0]
    }
  }

  return twitterValue;
}

export async function generateOpGrantSpaces() {
  const projectsData = getCsvData<ProjectData>(FILE_INPUT_PATH);
  const projectTitles: Set<string> = new Set(projectsData.map(projectData => projectData['Project Name'].trim()));

  const total = projectsData.length;
  let current = 0;

  const extractedProjectsTitles = new Set<string>();
  const extractedProjectsData: ExtractedProjectData[]= []

  let lastId = '1662b274-264c-4142-8ad5-50b79a25d11c';
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
          type: "proposal",
          createdAt: {
            gte: new Date("2024-01-01T00:00:00Z")
          }
        },
        status: "published",
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
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: batchSize,
    });

    if (proposals.length === 0) {
      break;
    }

    lastId = proposals[proposals.length - 1].id;

    for (const proposal of proposals) {
      const projectNameField = proposal.form?.formFields.find(formField => formField.name.toLowerCase().startsWith('project name'));
      const projectTitle = (projectNameField?.answers.find(answer => answer.proposalId === proposal.id)?.value as string)?.replace(/[^\p{L}\p{N}\p{P}\p{Z}|^$\n]/gu, '').trim();
      const projectData = projectsData.find(projectData => projectData['Project Name'].trim() === projectTitle);
      // If project title is not found in the CSV, or if it's already processed, or if it's not in the list of unique projects, or if the project data is not found, skip
      if (!projectTitle || extractedProjectsTitles.has(projectTitle) || !projectTitles.has(projectTitle) || !projectData) {
        continue;
      }

      try {
        const authors = proposal.authors.map(author => author.userId);
        const space = await createWorkspace({
          spaceData: {
            name: projectTitle,
            spaceImage: '',
            origin: spaceDomain,
          },
          userId: proposal.createdBy,
          extraAdmins: authors,
          spaceTemplate: 'templateImpactCommunity',
        });
        await updateTrackGroupProfile(space, spaceDomain);
        extractedProjectsData.push({
          "Project name": projectTitle,
          "Invite link": `https://app.charmverse.io/join?domain=${space.domain}`,
          "Twitter handle": extractTwitterUsername(projectData["Twitter"]) || ''
        })
        extractedProjectsTitles.add(projectTitle);
        await Promise.all(authors.map(author => addCharms({
          amount: projectData["Won?"] === "Yes" ? 100 : 20,
          recipient: {
            userId: author,
          },
          actorId: proposal.createdBy,
        })))
      } catch (err) {
        log.error(`Error creating space for project ${projectTitle}`, err);
      } finally {
        current++;
        console.log(`Project ${current} of ${total} done. ID: ${proposal.id}`)
      }
    }
  }

  writeFileSync(FILE_OUTPUT_PATH, unparse(extractedProjectsData));
}

generateOpGrantSpaces().then(() => console.log('Done'));
