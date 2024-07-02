import { prisma } from '@charmverse/core/prisma-client';

import type { OptimismProjectAttestationContent } from 'pages/api/optimism/projects';

export async function getOpProjectsByFarcasterId({ farcasterId }: { farcasterId: number }) {
  return prisma.optimismProjectAttestation.findMany({
    where: {
      farcasterIds: {
        has: farcasterId.toString()
      }
    }
  }) as Promise<OptimismProjectAttestationContent[]>;
}
