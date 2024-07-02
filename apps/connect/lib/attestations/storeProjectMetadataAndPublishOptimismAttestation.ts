import { DataNotFoundError } from '@charmverse/core/errors';
import type { OptimismProjectAttestation, OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { optimismSepolia } from 'viem/chains';

import { attestOnchain } from 'lib/credentials/attestOnchain';
import type {
  OptimismProjectAttestationData,
  OptimismProjectSnapshotAttestationMetaData
} from 'lib/credentials/schemas/optimismProjectSchemas';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

import { fetchProject } from '../actions/fetchProject';

import { projectAttestationChainId, projectAttestationIssuerName } from './constants';
import { storeProjectInS3 } from './storeProjectInS3';

export async function storeProjectMetadataAndPublishOptimismAttestation({
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

  const project = await fetchProject(projectId);

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

  const attestationUID = await attestOnchain({
    type: 'optimismProject',
    chainId,
    credentialInputs: {
      recipient: null,
      data: {
        farcasterID: farcasterUser.fid,
        issuer: projectAttestationIssuerName
      } as OptimismProjectAttestationData
    }
  });

  const attestationMetadataUID = await attestOnchain({
    type: 'optimismProject',
    chainId,
    credentialInputs: {
      recipient: null,
      data: {
        farcasterID: farcasterUser.fid,
        category: project.category || '',
        issuer: projectAttestationIssuerName,
        metadataType: 1,
        metadataUrl: staticFilePath,
        name: project.name,
        parentProjectRefUID: '',
        projectRefUID: attestationUID
      } as OptimismProjectSnapshotAttestationMetaData
    }
  });

  const attestationWithMetadata = await prisma.optimismProjectAttestation.create({
    data: {
      projectRefUID: attestationUID,
      metadataAttestationUID: attestationMetadataUID,
      metadataUrl: staticFilePath,
      name: project.name,
      chainId,
      timeCreated: new Date(),
      metadata: mappedProject
    }
  });

  return attestationWithMetadata;
}
