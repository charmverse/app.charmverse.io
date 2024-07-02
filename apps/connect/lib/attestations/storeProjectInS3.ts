import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';

import { awsS3Bucket } from 'config/constants';
import { uploadFileToS3 } from 'lib/aws/uploadToS3Server';

import type { ConnectProjectDetails } from '../actions/fetchProject';
import { fetchProject } from '../actions/fetchProject';

import { mapProjectToGitcoin } from './mapProjectToGitcoin';

const storageFormats = ['gitcoin', 'optimism'] as const;

type ProjectStorageFormat = (typeof storageFormats)[number];

export async function storeProjectInS3({
  projectOrProjectId,
  storageFormat
}: {
  projectOrProjectId: ConnectProjectDetails | string;
  storageFormat: ProjectStorageFormat;
}): Promise<{ staticFilePath: string }> {
  if (!storageFormats.includes(storageFormat)) {
    throw new InvalidInputError('Invalid storage format');
  }

  const project = typeof projectOrProjectId === 'string' ? await fetchProject(projectOrProjectId) : projectOrProjectId;

  if (!project) {
    throw new DataNotFoundError('Project not found');
  }

  const filePath = `connect/projects/${project.id}/${storageFormat}/project.json`;

  let formattedProject: any;

  if (storageFormat === 'gitcoin') {
    formattedProject = mapProjectToGitcoin({ project });
  } else if (storageFormat === 'optimism') {
    formattedProject = project;
  } else {
    throw new InvalidInputError('Invalid storage format');
  }

  await uploadFileToS3({
    pathInS3: filePath,
    content: Buffer.from(JSON.stringify(formattedProject)),
    contentType: 'application/json'
  });

  return { staticFilePath: `https://s3.amazonaws.com/${awsS3Bucket}/${filePath}` };
}
