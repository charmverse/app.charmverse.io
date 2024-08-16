import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';

import { findProject } from '../projects/findProject';

import { createProjectViaAgora, storeProjectMetadataViaAgora } from './agoraApi';

// Format for metadata.json:
// attestations/{schemaId}/project-{charmverse_uid}/metadata.json

export async function storeProjectMetadataAndPublishOptimismAttestation({
  userId,
  projectId,
  tx = prisma
}: {
  userId: string;
  projectId: string;
} & OptionalPrismaTransaction): Promise<{ projectRefUID: string; attestationMetadataUID: string }> {
  const farcasterUser = await tx.farcasterUser.findUniqueOrThrow({
    where: {
      userId
    },
    select: {
      account: true,
      fid: true
    }
  });

  const project = await findProject({ id: projectId });

  if (!project) {
    throw new DataNotFoundError('Project not found');
  }

  const fcProfile = await getFarcasterProfile({
    fid: farcasterUser.fid
  });

  if (!fcProfile) {
    throw new DataNotFoundError('Farcaster profile not found');
  }

  const { attestationId: projectRefUID } = await createProjectViaAgora({
    farcasterId: farcasterUser.fid,
    projectName: project.name
  });

  const { attestationMetadataUID } = await storeProjectMetadataViaAgora({
    farcasterId: farcasterUser.fid,
    projectRefUID,
    projectId
  });

  return { projectRefUID, attestationMetadataUID };
}
