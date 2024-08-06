import { DataNotFoundError } from '@charmverse/core/errors';
import type { OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';

import { fetchProject } from '../projects/fetchProject';

import { storeProjectMetadataViaAgora } from './agoraApi';

// Format for metadata.json:
// attestations/{schemaId}/project-{charmverse_uid}/metadata.json

export async function storeUpdatedProjectMetadataAttestation({
  userId,
  projectId,
  tx = prisma
}: {
  userId: string;
  projectId: string;
} & OptionalPrismaTransaction) {
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

  const existingOptimismAttestation = await prisma.optimismProjectAttestation.findFirstOrThrow({
    where: {
      projectId: project.id
    },
    select: {
      projectRefUID: true
    }
  });

  await storeProjectMetadataViaAgora({
    farcasterId: farcasterUser.fid,
    projectRefUID: existingOptimismAttestation.projectRefUID,
    projectId
  });
}
