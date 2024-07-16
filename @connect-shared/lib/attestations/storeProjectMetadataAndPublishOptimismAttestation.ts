import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getEasInstance } from '@root/lib/credentials/connectors';
import { getAttestation } from '@root/lib/credentials/getAttestation';
import { decodeOptimismProjectSnapshotAttestation } from '@root/lib/credentials/schemas/optimismProjectSchemas';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { optimism } from 'viem/chains';

import { fetchProject } from '../projects/fetchProject';

import { createProjectViaAgora, storeProjectMetadataViaAgora } from './agoraApi';
import { mapProjectToOptimism } from './mapProjectToOptimism';

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

  const { attestationId: projectRefUID } = await createProjectViaAgora({
    farcasterId: farcasterUser.fid,
    projectName: project.name
  });

  log.info('Project created via Agora', { projectRefUID });

  const { attestationId: attestationMetadataUID } = await storeProjectMetadataViaAgora({
    farcasterId: farcasterUser.fid,
    projectRefUID,
    projectId
  });

  log.info('Project metadata created via Agora', { attestationMetadataUID });

  const { metadataUrl, name } = await getAttestation({
    attestationUID: attestationMetadataUID,
    chainId: optimism.id
  }).then((data) => decodeOptimismProjectSnapshotAttestation(data.data));

  await prisma.optimismProjectAttestation.create({
    data: {
      metadata: mapProjectToOptimism(project),
      farcasterIds: project.projectMembers
        .map((member) => parseInt(member.farcasterUser.fid.toString()))
        .filter(Boolean),
      projectRefUID,
      chainId: optimism.id,
      metadataAttestationUID: attestationMetadataUID,
      metadataUrl,
      name,
      project: {
        connect: {
          id: projectId
        }
      },
      timeCreated: new Date()
    }
  });

  return { projectRefUID, attestationMetadataUID };
}
