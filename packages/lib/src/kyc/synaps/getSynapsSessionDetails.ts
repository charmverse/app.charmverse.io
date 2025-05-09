import { prisma } from '@charmverse/core/prisma-client';

import type { SynapsSessionDetails } from './interfaces';

export async function getSynapsSessionDetails(spaceId: string, userId: string): Promise<SynapsSessionDetails | null> {
  const [synapsCredential, synapsUserKyc] = await prisma.$transaction([
    prisma.synapsCredential.findUnique({
      where: {
        spaceId
      }
    }),
    prisma.synapsUserKyc.findFirst({
      where: {
        userId,
        spaceId
      }
    })
  ]);

  if (
    !synapsCredential?.apiKey ||
    !synapsUserKyc?.sessionId ||
    !synapsUserKyc?.status ||
    synapsUserKyc?.status === 'RESUBMISSION_REQUIRED'
  ) {
    return null;
  }

  return {
    id: synapsUserKyc.sessionId,
    status: synapsUserKyc.status
  };
}
