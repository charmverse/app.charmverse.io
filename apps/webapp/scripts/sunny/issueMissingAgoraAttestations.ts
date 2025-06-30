import { log } from '@packages/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { prettyPrint } from '@packages/utils/strings';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@packages/connect-shared/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';

type ParsedProject = {
  id: string;
  Url: string;
  Created: string;
  Name: string;
  Type: string;
  Creator: string;
  'Team members': string;
  Category: string;
  Website: string;
  'Additional Urls': string;
  Github: string;
  'Agora Metadata Attestation': string;
  'Valid Github URLs': string;
  'Detected anomalies': string;
  Value: string;
  'Extra Website': string;
  'New Github': string;
  Flagged: string;
};

const projectsToResolveWithAttestationId: Record<string, string> = {};

async function issueMissingAgoraAttestations({ startFromId }: { startFromId?: string } = {}) {
  // Dont run script without deduplication keys
  // Download from https://app.charmverse.io/charmverse/backfill-missing-attestations-8588341626366727
  if (Object.keys(projectsToResolveWithAttestationId).length === 0) {
    throw new InvalidInputError(
      'No projects to resolve. Get the list from https://app.charmverse.io/charmverse/backfill-missing-attestations-8588341626366727'
    );
  }

  // Avoid repeating ourselves
  const lastItem = Object.keys(projectsToResolveWithAttestationId).pop();

  startFromId = startFromId || lastItem;

  const fileContent = readFileSync(path.resolve(__dirname, 'Agora Cleanup - filtered projects.tsv'), 'utf-8');

  const parsed = Papa.parse(fileContent, {
    delimiter: '\t', // Use tab as delimiter
    header: true, // Ensure the first line is treated as headers
    skipEmptyLines: true
  });

  const headers = [
    'id',
    'Url',
    'Created',
    'Name',
    'Type',
    'Creator',
    'Team members',
    'Category',
    'Website',
    'Additional Urls',
    'Github',
    'Agora Metadata Attestation',
    'Valid Github URLs',
    'Detected anomalies',
    'Value',
    'Extra Website',
    'New Github',
    'Flagged'
  ];

  const dataWithHeaders = parsed.data.map((row: any) => {
    const formattedRow: Record<string, any> = {};
    headers.forEach((header) => {
      formattedRow[header] = row[header] || ''; // Use empty string if the value is missing
    });
    return formattedRow as ParsedProject;
  });

  const startIndex = startFromId ? dataWithHeaders.findIndex((row) => row.id === startFromId) : 0;

  if (startIndex === -1) {
    throw new InvalidInputError(`Could not find project with id ${startFromId}`);
  }

  const dataToProcess = dataWithHeaders.slice(startIndex);

  for (let i = 0; i < dataToProcess.length; i++) {
    let record = dataToProcess[i];

    if (projectsToResolveWithAttestationId[record.id]) {
      log.info(`Skipping project ${record.id} as it needs resolution`);
      continue;
    }

    if (record.Flagged !== '') {
      log.info(`Skipping flagged project ${record.id}`);
      continue;
    }

    console.log('\r\n\r\n----------------------\r\n');
    log.info(`Processing project ${record.id}`);

    const existingProject = await prisma.project.findUniqueOrThrow({
      where: {
        id: record.id
      },
      select: {
        id: true,
        websites: true,
        github: true,
        createdBy: true,
        pptimismProjectAttestations: true
      }
    });

    if (existingProject.pptimismProjectAttestations.length) {
      log.info(
        `Project ${record.id} already has an attestation with refUID: ${existingProject.pptimismProjectAttestations[0].projectRefUID} and metadata ${existingProject.pptimismProjectAttestations[0].metadataAttestationUID}`
      );
      continue;
    }

    const extraWebsite = record['Valid Github URLs'] ?? record['Extra Website'] ?? undefined;

    const updatedWebsitesValue = existingProject.websites.includes(extraWebsite)
      ? existingProject.websites
      : [...existingProject.websites, extraWebsite].filter(Boolean);

    await prisma.project.update({
      where: {
        id: record.id
      },
      data: {
        websites: updatedWebsitesValue,
        github: null
      }
    });

    log.info(`Updated project ${record.id} with extra website ${extraWebsite}`);

    const existingProjectRefUID = projectsToResolveWithAttestationId[record.id]?.startsWith('0x')
      ? projectsToResolveWithAttestationId[record.id]
      : undefined;

    await storeProjectMetadataAndPublishOptimismAttestation({
      projectId: existingProject.id,
      userId: existingProject.createdBy,
      existingProjectRefUID
    });

    console.log(`${i + 1} of ${dataToProcess.length} projects processed`);
    console.log('\r\n\r\n----------------------\r\n');
  }
}

// issueMissingAgoraAttestations({startFromId: startFromId}).then(console.log).catch(console.error);
