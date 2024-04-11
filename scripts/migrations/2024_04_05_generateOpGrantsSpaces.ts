import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { createWorkspace } from 'lib/spaces/createSpace';
import { getFilenameWithExtension } from 'lib/utils/getFilenameWithExtension';
import { appendFileSync, readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { unparse } from 'papaparse';

const spaceDomain = "op-grants";
const FILE_INPUT_PATH = './op.csv';
const FILE_OUTPUT_PATH = './op-output.csv';

function getCsvData<T>(path: string): T[] {
  try {
    const content = readFileSync(path).toString();
    const records = parse(content, { columns: true }) as T[];

    return records;
  } catch (e) {}

  return [];
}

type ProjectData = {
  'Project Name': string
  'Twitter': string
  'Won?': string
}

type ExtractedProjectData = {
  title: string
  twitterHandle: string
  joinUrl: string
  authors: string[]
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
  const extractedProjectsData: ExtractedProjectData[]= []

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
          type: "proposal",
          createdAt: {
            gte: new Date("2024-01-01T00:00:00Z")
          }
        },
        archived: false,
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
      const projectNameField = proposal.form?.formFields.find(formField => formField.name === "Project name:" || formField.name === "Project Name:" || formField.name === "Project Name");
      const projectTitle = (projectNameField?.answers.find(answer => answer.proposalId === proposal.id)?.value as string)?.replace(/[\p{Emoji}]/gu, '').trim();
      if (!projectTitle) {
        continue;
      }

      if (extractedProjectsTitles.has(projectTitle) || !projectTitles.has(projectTitle)) {
        continue;
      }

      try {
        const authors = proposal.authors.map(author => author.userId);
        let spaceImageUrl = '';
        if (spaceImageUrl) {
          const pathInS3 = getUserS3FilePath({ userId: proposal.createdBy, url: getFilenameWithExtension(spaceImageUrl) });
          try {
            const { url } = await uploadUrlToS3({ pathInS3, url: spaceImageUrl });
            spaceImageUrl = url;
          } catch (error) {
            log.error(`error uploading space image ${projectTitle}`, spaceImageUrl, error);
          }
        }
        const space = await createWorkspace({
          spaceData: {
            name: projectTitle,
            spaceImage: spaceImageUrl,
            origin: spaceDomain,
          },
          userId: proposal.createdBy,
          extraAdmins: authors,
          spaceTemplate: 'templateImpactCommunity',
        });
        await updateTrackGroupProfile(space, spaceDomain);
        extractedProjectsData.push({
          authors,
          title: projectTitle,
          joinUrl: `https://app.charmverse.io/join?domain=${space.domain}`,
          twitterHandle: ''
        })
        extractedProjectsTitles.add(projectTitle);
      } catch (err) {
        log.error(`Error creating space for project ${projectTitle}`, err);
      } finally {
        current++;
        console.log(`Project ${current} of ${total} done.`)
      }
    }
  }

  appendFileSync(FILE_OUTPUT_PATH, unparse(extractedProjectsData));
}

generateOpGrantSpaces().then(() => console.log('Done'));
