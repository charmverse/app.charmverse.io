import { prisma } from '@charmverse/core/prisma-client';

import { getSynapsIndividualSession } from './getSynapsIndividualSession';
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

  if (!synapsCredential?.apiKey) {
    return null;
  }

  if (!synapsUserKyc?.sessionId) {
    return null;
  }

  const individualSession = await getSynapsIndividualSession({
    sessionId: synapsUserKyc.sessionId,
    apiKey: synapsCredential.apiKey
  });

  return {
    id: individualSession.session.id,
    status: individualSession.session.status,
    sandbox: individualSession.session.sandbox
  };
}
