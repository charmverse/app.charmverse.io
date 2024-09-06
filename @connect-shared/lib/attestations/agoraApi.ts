import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { DELETE, POST } from '@root/adapters/http';
import { EasSchemaChain } from '@root/lib/credentials/connectors';
import { getAttestation } from '@root/lib/credentials/getAttestation';
import { mapProjectToOptimism } from '@root/lib/credentials/mapProjectToOptimism';
import { decodeOptimismProjectSnapshotAttestation } from '@root/lib/credentials/schemas/optimismProjectUtils';
import { optimism } from 'viem/chains';

export const AGORA_API_KEY = process.env.AGORA_API_KEY as string;

export async function createProjectViaAgora({
  farcasterId,
  projectName
}: {
  farcasterId: string | number;
  projectName: string;
}): Promise<{ attestationId: string }> {
  const result = await POST<{ attestationId: string }>(
    'https://retrofunding.optimism.io/api/v1/projects',
    {
      farcasterId: farcasterId.toString(),
      name: projectName
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AGORA_API_KEY}`
      }
    }
  );

  log.info('Project created via Agora', { projectRefUID: result.attestationId });

  return result;
}

export async function storeProjectMetadataViaAgora({
  farcasterId,
  projectRefUID,
  projectId
}: {
  farcasterId: string | number;
  projectId: string;
  projectRefUID: string;
}) {
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    include: {
      projectMembers: {
        select: {
          teamLead: true,
          farcasterId: true,
          userId: true,
          user: {
            select: {
              farcasterUser: true
            }
          }
        }
      }
    }
  });

  const projectMetadata = mapProjectToOptimism({
    ...project,
    projectMembers: project.projectMembers.map((pm) => {
      return {
        farcasterId: pm.farcasterId as number
      };
    })
  });

  return createProjectMetadataAttestation({
    farcasterId,
    farcasterIds: project.projectMembers.map((pm) => pm.farcasterId as number),
    projectMetadata,
    projectRefUID,
    projectId
  });
}

export async function createProjectMetadataAttestation({
  projectRefUID,
  farcasterId,
  projectMetadata,
  farcasterIds,
  projectId
}: {
  projectId?: string | null;
  farcasterId: number | string;
  projectRefUID: string;
  projectMetadata: Prisma.InputJsonValue;
  farcasterIds: number[];
}) {
  const { attestationId: attestationMetadataUID } = await POST<{ attestationId: string }>(
    `https://retrofunding.optimism.io/api/v1/projects/${projectRefUID}/metadata_snapshot`,
    {
      farcasterId: farcasterId.toString(),
      metadata: projectMetadata
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AGORA_API_KEY}`
      }
    }
  );

  log.info('Project metadata created via Agora', { attestationMetadataUID });

  const attestationData = await getAttestation({
    attestationUID: attestationMetadataUID,
    chainId: optimism.id
  }).then((data) => decodeOptimismProjectSnapshotAttestation(data.data));

  const existingProject = await prisma.optimismProjectAttestation.findFirst({
    where: {
      projectRefUID
    },
    select: {
      projectId: true
    }
  });

  if (existingProject?.projectId && projectId && existingProject?.projectId !== projectId) {
    throw new InvalidInputError('Project already imported');
  }

  await prisma.optimismProjectAttestation.upsert({
    where: {
      projectRefUID
    },
    create: {
      metadata: projectMetadata,
      farcasterIds,
      projectRefUID,
      chainId: optimism.id,
      metadataAttestationUID: attestationMetadataUID,
      metadataUrl: attestationData.metadataUrl,
      name: attestationData.name,
      project: projectId
        ? {
            connect: {
              id: projectId
            }
          }
        : undefined,
      timeCreated: new Date()
    },
    update: {
      metadata: projectMetadata,
      farcasterIds,
      name: attestationData.name,
      metadataAttestationUID: attestationMetadataUID,
      metadataUrl: attestationData.metadataUrl,
      project: projectId ? { connect: { id: projectId } } : undefined
    }
  });

  return {
    attestationMetadataUID
  };
}

export async function revokeAgoraProjectAttestation({ projectRefUID }: { projectRefUID: string }) {
  const result = DELETE<{ attestationId: string }>(
    `https://retrofunding.optimism.io/api/v1/projects/${projectRefUID}`,
    undefined,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AGORA_API_KEY}`
      }
    }
  );

  log.info('Project deleted in Agora', { projectRefUID });

  return result;
}
