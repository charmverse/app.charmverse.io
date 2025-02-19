import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { findProject } from '@packages/connect-shared/lib/projects/findProject';
import { awsS3Bucket } from '@root/config/constants';
import { uploadFileToS3 } from '@root/lib/aws/uploadToS3Server';
import { mapProjectToGitcoin } from '@root/lib/credentials/mapProjectToGitcoin';
import { mapProjectToOptimism } from '@root/lib/credentials/mapProjectToOptimism';
import { replaceS3Domain } from '@root/lib/utils/url';

import { getAttestationS3Path } from './getAttestationS3Path';
import { charmProjectMetadataSchemaId } from './schemas/charmProjectMetadata';
import { gitcoinProjectCredentialSchemaId } from './schemas/gitcoinProjectSchema';
import { optimismProjectSnapshotAttestationSchemaId } from './schemas/optimismProjectSchemas';

const storageFormats = ['gitcoin', 'optimism', 'charmverse'] as const;

type ProjectStorageFormat = (typeof storageFormats)[number];

export async function storeProjectInS3<T = any>({
  projectId,
  storageFormat,
  extraData
}: {
  projectId: string;
  storageFormat: ProjectStorageFormat;
  extraData?: T;
}): Promise<{ staticFilePath: string; mappedProject: any }> {
  if (!storageFormats.includes(storageFormat)) {
    throw new InvalidInputError('Invalid storage format');
  }

  let project = await findProject({ id: projectId });

  if (!project) {
    throw new DataNotFoundError('Project not found');
  }

  const optimismAttestation = await prisma.optimismProjectAttestation.findFirst({
    where: {
      projectId: project.id
    },
    select: {
      projectRefUID: true
    },
    orderBy: {
      timeCreated: 'desc'
    }
  });

  // Expand extra fields
  project = { ...project, ...extraData };

  let filePath: string;

  let formattedProject: any;

  const projectMembers = project.projectMembers
    .map((m) => ({ farcasterId: m.farcasterUser.fid }))
    .filter((m) => !!m.farcasterId) as { farcasterId: number }[];

  if (storageFormat === 'gitcoin') {
    formattedProject = mapProjectToGitcoin({ project, agoraProjectRefUID: optimismAttestation?.projectRefUID });
    filePath = getAttestationS3Path({
      schemaId: gitcoinProjectCredentialSchemaId,
      charmverseId: project.id,
      charmverseIdType: 'project'
    });
  } else if (storageFormat === 'optimism') {
    formattedProject = mapProjectToOptimism({
      ...project,
      projectMembers
    });
    filePath = getAttestationS3Path({
      schemaId: optimismProjectSnapshotAttestationSchemaId,
      charmverseId: project.id,
      charmverseIdType: 'project'
    });
  } else if (storageFormat === 'charmverse') {
    formattedProject = { ...mapProjectToOptimism({ ...project, projectMembers }), ...extraData };
    filePath = getAttestationS3Path({
      schemaId: charmProjectMetadataSchemaId,
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
