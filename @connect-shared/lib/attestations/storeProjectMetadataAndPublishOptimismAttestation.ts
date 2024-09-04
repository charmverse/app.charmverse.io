import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';

import { createProjectViaAgora, storeProjectMetadataViaAgora, AGORA_API_KEY } from './agoraApi';

// Format for metadata.json:
// attestations/{schemaId}/project-{charmverse_uid}/metadata.json

export async function storeProjectMetadataAndPublishOptimismAttestation({
  userId,
  projectId,
  tx = prisma,
  existingProjectRefUID
}: {
  userId: string;
  projectId: string;
  existingProjectRefUID?: string;
} & OptionalPrismaTransaction): Promise<null | { projectRefUID: string; attestationMetadataUID: string }> {
  if (!AGORA_API_KEY) {
    log.debug('Skip Agora integration: no API key');
    return null;
  }
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

  if (existingProjectRefUID) {
    const existingAttestation = await prisma.optimismProjectAttestation.findFirst({
      where: {
        projectRefUID: existingProjectRefUID,
        projectId: {
          not: null
        }
      }
    });

    if (existingAttestation && existingAttestation.projectId !== projectId) {
      throw new InvalidInputError('Attestation already made against a different project');
    }
  }

  // Used when importing a project from OP
  let projectRefUID = existingProjectRefUID;

  if (!projectRefUID) {
    const { attestationId } = await createProjectViaAgora({
      farcasterId: farcasterUser.fid,
      projectName: project.name
    });
    projectRefUID = attestationId;
  }

  const { attestationMetadataUID } = await storeProjectMetadataViaAgora({
    farcasterId: farcasterUser.fid,
    projectRefUID,
    projectId
  });

  return { projectRefUID, attestationMetadataUID };
}
