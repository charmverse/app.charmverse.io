import { DataNotFoundError } from '@charmverse/core/errors';
import type { OptimismProjectAttestation, OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

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

  const inputData = {
    farcasterID: farcasterUser.fid,
    category: project.category || '',
    issuer: projectAttestationIssuerName,
    metadataType: 1,
    metadataUrl: staticFilePath,
    name: project.name,
    parentProjectRefUID: '',
    projectRefUID: attestationUID
  } as OptimismProjectSnapshotAttestationMetaData;

  const attestationMetadataUID = await attestOnchain({
    type: 'optimismProjectSnapshot',
    chainId,
    credentialInputs: {
      recipient: null,
      data: inputData
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

const inputData = {
  farcasterID: 4339,
  category: 'Defi',
  issuer: projectAttestationIssuerName,
  metadataType: 1,
  metadataUrl: 'www.example.com',
  name: 'Demo',
  parentProjectRefUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
  projectRefUID: '0x8222da54406a4d9eab91006c95cd4ec6279be90297d524e3dcc896d40fa8ca96'
} as OptimismProjectSnapshotAttestationMetaData;
