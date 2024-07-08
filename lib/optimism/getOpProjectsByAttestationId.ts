import { prisma } from '@charmverse/core/prisma-client';

import type { OptimismProjectAttestationContent } from 'pages/api/optimism/projects';

export async function getOpProjectsByAttestationId({ projectRefUID }: { projectRefUID: string }) {
  return prisma.optimismProjectAttestation.findUnique({
    where: {
      projectRefUID
    }
  }) as Promise<OptimismProjectAttestationContent | null>;
}
