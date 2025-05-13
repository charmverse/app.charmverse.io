import { DataNotFoundError } from '@charmverse/core/errors';
import type { OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterProfile } from '@packages/farcaster/getFarcasterProfile';

import { createProjectViaAgora, storeProjectMetadataViaAgora } from './agoraApi';

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

  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { name: true } });

  const fcProfile = await getFarcasterProfile({
    fid: farcasterUser.fid
  });

  if (!fcProfile) {
    throw new DataNotFoundError('Farcaster profile not found');
  }

  let projectRefUIDFromDb = await prisma.optimismProjectAttestation
    .findFirst({
      where: {
        projectId
      },
      select: {
        projectRefUID: true
      }
    })
    .then((result) => result?.projectRefUID);

  if (!projectRefUIDFromDb) {
    projectRefUIDFromDb = await createProjectViaAgora({
      farcasterId: farcasterUser.fid,
      projectName: project.name
    }).then((result) => result.attestationId);
  }

  await storeProjectMetadataViaAgora({
    farcasterId: farcasterUser.fid,
    projectRefUID: projectRefUIDFromDb as string,
    projectId
  });
}
