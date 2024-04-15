import { prisma } from '@charmverse/core/prisma-client';

import type { WebhookMessageProcessResult } from 'lib/collabland/webhook/interfaces';

import { getSynapsIndividualSession } from '../getSynapsIndividualSession';
import type { SynapsEventData } from '../interfaces';

export async function processWebhookMessage(payload: {
  body: SynapsEventData;
  headers: any;
  query: { secret: string };
}): Promise<WebhookMessageProcessResult> {
  const secret = payload?.query?.secret;
  const data = payload?.body;

  const synapsCredential = await prisma.synapsCredential.findFirst({
    where: {
      secret
    }
  });

  if (!synapsCredential) {
    return {
      success: true,
      message: `Synaps credential not found with secret id ${secret}`
    };
  }

  const synapsUserKyc = await prisma.synapsUserKyc.findFirst({
    where: {
      sessionId: data?.session_id
    }
  });

  if (!synapsUserKyc) {
    return {
      success: true,
      message: `Synaps user kyc not found with session id ${data?.session_id}`
    };
  }

  try {
    const individualSession = await getSynapsIndividualSession({
      sessionId: synapsUserKyc.sessionId,
      apiKey: synapsCredential.apiKey
    });

    if (!individualSession) {
      throw new Error();
    }
  } catch (err) {
    return {
      success: true,
      message: `Synaps individual session not found with session id ${synapsUserKyc.sessionId}`
    };
  }

  await prisma.synapsUserKyc.update({
    where: {
      id: synapsUserKyc.id
    },
    data: {
      status: data.status
    }
  });

  return {
    success: true,
    message: `Synaps event processed for user kyc ${synapsUserKyc.id}`
  };
}
