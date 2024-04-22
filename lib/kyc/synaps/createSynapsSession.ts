import { DataNotFoundError, UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { initSynapsSession } from './initSynapsSession';
import type { SynapsSession } from './interfaces';

export async function createSynapsSession(spaceId: string, userId: string): Promise<SynapsSession> {
  const [synapsCredential, synapsUserKyc] = await prisma.$transaction([
    prisma.synapsCredential.findUnique({
      where: {
        spaceId
      }
    }),
    prisma.synapsUserKyc.findUnique({
      where: {
        spaceId,
        userId
      }
    })
  ]);

  if (!synapsCredential?.apiKey) {
    throw new DataNotFoundError('Synaps API key not found');
  }

  if (synapsUserKyc?.sessionId) {
    const isReadOnly = ['APPROVED', 'PENDING_VERIFICATION', 'REJECTED'].includes(synapsUserKyc.status || '');

    if (isReadOnly) {
      throw new UnauthorisedActionError(
        `You can't create a session for this user because of his status: ${synapsUserKyc.status}`
      );
    } else {
      return {
        session_id: synapsUserKyc.sessionId
      };
    }
  }

  const session = await initSynapsSession({ userId, apiKey: synapsCredential.apiKey });

  await prisma.synapsUserKyc.upsert({
    where: {
      userId,
      spaceId
    },
    create: {
      userId,
      spaceId,
      status: 'SUBMISSION_REQUIRED',
      sessionId: session.session_id
    },
    update: {
      sessionId: session.session_id,
      status: 'SUBMISSION_REQUIRED'
    }
  });

  return session;
}
