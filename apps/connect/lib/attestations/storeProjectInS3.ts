import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';

import { awsS3Bucket } from 'config/constants';
import { uploadFileToS3 } from 'lib/aws/uploadToS3Server';
import { gitcoinProjectCredentialSchemaId } from 'lib/credentials/schemas/gitcoinProjectSchema';
import { optimismProjectSnapshotAttestationSchemaId } from 'lib/credentials/schemas/optimismProjectSchemas';
import { replaceS3Domain } from 'lib/utils/url';

import type { ConnectProjectDetails } from '../actions/fetchProject';
import { fetchProject } from '../actions/fetchProject';

import { getAttestationS3Path } from './getAttestationS3Path';
import { mapProjectToGitcoin } from './mapProjectToGitcoin';

const storageFormats = ['gitcoin', 'optimism'] as const;

type ProjectStorageFormat = (typeof storageFormats)[number];

export async function storeProjectInS3({
  projectOrProjectId,
  storageFormat
}: {
  projectOrProjectId: ConnectProjectDetails | string;
  storageFormat: ProjectStorageFormat;
}): Promise<{ staticFilePath: string; mappedProject: any }> {
  if (!storageFormats.includes(storageFormat)) {
    throw new InvalidInputError('Invalid storage format');
  }

  const project = typeof projectOrProjectId === 'string' ? await fetchProject(projectOrProjectId) : projectOrProjectId;

  if (!project) {
    throw new DataNotFoundError('Project not found');
  }

  let filePath: string;

  let formattedProject: any;

  if (storageFormat === 'gitcoin') {
    formattedProject = mapProjectToGitcoin({ project });
    filePath = getAttestationS3Path({
      schemaId: gitcoinProjectCredentialSchemaId,
      charmverseId: project.id,
      charmverseIdType: 'project'
    });
  } else if (storageFormat === 'optimism') {
    formattedProject = project;
    filePath = getAttestationS3Path({
      schemaId: optimismProjectSnapshotAttestationSchemaId,
      charmverseId: project.id,
      charmverseIdType: 'project'
    });
  } else {
    throw new InvalidInputError('Invalid storage format');
  }

  await uploadFileToS3({
    pathInS3: filePath,
    content: Buffer.from(JSON.stringify(formattedProject)),
    contentType: 'application/json'
  });

  return {
    staticFilePath: replaceS3Domain(`https://s3.amazonaws.com/${awsS3Bucket}/${filePath}`),
    mappedProject: formattedProject
  };
}
