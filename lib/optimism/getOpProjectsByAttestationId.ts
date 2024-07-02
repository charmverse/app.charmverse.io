import { prisma } from '@charmverse/core/prisma-client';

import type { OptimismProjectAttestationContent } from 'pages/api/optimism/projects';

export async function getOpProjectsByAttestationId({ attestationId }: { attestationId: string }) {
  return prisma.optimismProjectAttestation.findUnique({
    where: {
      attestationId
    }
  }) as Promise<OptimismProjectAttestationContent | null>;
}
