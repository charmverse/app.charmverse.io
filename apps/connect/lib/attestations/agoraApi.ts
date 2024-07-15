import { prisma } from '@charmverse/core/prisma-client';
import { POST } from '@root/adapters/http';

import type { FarcasterUserWithProfile } from 'lib/farcaster/loginWithFarcaster';
import { isTruthy } from 'lib/utils/types';

import { mapProjectToOptimism } from './mapProjectToOptimism';

const AGORA_API_KEY = process.env.AGORA_API_KEY as string;

export function createProjectViaAgora({
  farcasterId
}: {
  farcasterId: string | number;
}): Promise<{ attestationId: string }> {
  return POST(
    'https://retrofunding.optimism.io/api/v1/projects',
    {
      farcasterId
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AGORA_API_KEY}`
      }
    }
  );
}

export async function storeProjectMetadataViaAgora({
  farcasterId,
  projectRefUID,
  projectId
}: {
  farcasterId: string | number;
  projectId: string;
  projectRefUID: string;
}): Promise<{ attestationId: string }> {
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    include: {
      projectMembers: true
    }
  });

  const fids = project.projectMembers.map((pm) => pm.farcasterId).filter(isTruthy);

  const farcasterUsers = await prisma.farcasterUser.findMany({
    where: {
      fid: {
        in: fids
      }
    }
  });

  return POST(
    `https://retrofunding.optimism.io/api/v1/projects/${projectRefUID}/metadata_snapshot`,
    {
      farcasterId,
      metadata: mapProjectToOptimism({
        ...project,
        projectMembers: project.projectMembers
          .map((pm) => {
            const farcasterUser = farcasterUsers.find((fu) => fu.fid === pm.farcasterId) as FarcasterUserWithProfile;

            return {
              ...pm,
              farcasterUser: {
                ...farcasterUser.account
              }
            };
          })
          .filter((pm) => !!pm.farcasterUser)
      })
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AGORA_API_KEY}`
      }
    }
  );
}
