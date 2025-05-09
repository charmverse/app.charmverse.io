import { prisma } from '@charmverse/core/prisma-client';
import type { SynapsEventData } from '@packages/lib/kyc/synaps/interfaces';

import type { WebhookMessageProcessResult } from '../../processCollablandWebhookMessages/webhook/interfaces';

export async function processWebhookMessage(payload: {
  body: SynapsEventData;
  headers: any;
  query: { secret: string };
}): Promise<WebhookMessageProcessResult> {
  const secret = payload?.query?.secret;
  const data = payload?.body;

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

  const synapsCredential = await prisma.synapsCredential.findUnique({
    where: {
      secret,
      spaceId: synapsUserKyc.spaceId
    }
  });

  if (!synapsCredential) {
    return {
      success: true,
      spaceIds: [synapsUserKyc.spaceId],
      message: `Synaps credential not found with secret id ${secret}`
    };
  }

  await prisma.synapsUserKyc.update({
    where: {
      id: synapsUserKyc.id
    },
    data: {
      status: data.status || data.state
    }
  });

  return {
    success: true,
    spaceIds: [synapsUserKyc.spaceId],
    message: `Synaps event processed for user kyc ${synapsUserKyc.id}`
  };
}
