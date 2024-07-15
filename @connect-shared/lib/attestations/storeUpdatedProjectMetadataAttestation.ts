import { DataNotFoundError } from '@charmverse/core/errors';
import type { OptimismProjectAttestation, OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { attestOnchain } from '@root/lib/credentials/attestOnchain';
import type { OptimismProjectSnapshotAttestationMetaData } from '@root/lib/credentials/schemas/optimismProjectSchemas';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';

import { fetchProject } from '../projects/fetchProject';

import { projectAttestationChainId, projectAttestationIssuerName } from './constants';
import { storeProjectInS3 } from './storeProjectInS3';

// Format for metadata.json:
// attestations/{schemaId}/project-{charmverse_uid}/metadata.json

export async function storeUpdatedProjectMetadataAttestation({
  userId,
  projectId,
  tx = prisma
}: {
  userId: string;
  projectId: string;
} & OptionalPrismaTransaction): Promise<OptimismProjectAttestation> {
  const farcasterUser = await tx.farcasterUser.findUniqueOrThrow({
    where: {
      userId
    },
    select: {
      account: true,
      fid: true
    }
  });

  const project = await fetchProject({ id: projectId });

  if (!project) {
    throw new DataNotFoundError('Project not found');
  }

  const fcProfile = await getFarcasterProfile({
    fid: farcasterUser.fid
  });

  if (!fcProfile) {
    throw new DataNotFoundError('Farcaster profile not found');
  }
  const { staticFilePath, mappedProject } = await storeProjectInS3({
    projectOrProjectId: project,
    storageFormat: 'optimism'
  });

  const chainId = projectAttestationChainId;

  const existingOptimismAttestation = await prisma.optimismProjectAttestation.findFirstOrThrow({
    where: {
      projectId: project.id
    },
    select: {
      projectRefUID: true
    }
  });

  const inputData = {
    farcasterID: farcasterUser.fid,
    category: project.category || '',
    issuer: projectAttestationIssuerName,
    metadataType: 1,
    metadataUrl: staticFilePath,
    name: project.name,
    parentProjectRefUID: '',
    projectRefUID: existingOptimismAttestation.projectRefUID
  } as OptimismProjectSnapshotAttestationMetaData;

  const attestationMetadataUID = await attestOnchain({
    type: 'optimismProjectSnapshot',
    chainId,
    credentialInputs: {
      recipient: null,
      data: inputData
    }
  });

  const attestationWithMetadata = await prisma.optimismProjectAttestation.update({
    where: {
      projectRefUID: existingOptimismAttestation.projectRefUID
    },
    data: {
      metadataAttestationUID: attestationMetadataUID,
      metadataUrl: staticFilePath,
      name: project.name,
      timeCreated: new Date(),
      metadata: mappedProject
    }
  });

  return attestationWithMetadata;
}
