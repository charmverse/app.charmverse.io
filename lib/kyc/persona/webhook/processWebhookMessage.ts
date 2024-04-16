import { prisma } from '@charmverse/core/prisma-client';

import type { WebhookMessageProcessResult } from 'lib/collabland/webhook/interfaces';

import type { PersonaEventData } from '../interfaces';

import { checkSignature } from './checkSignature';

export async function processWebhookMessage(payload: {
  body: PersonaEventData;
  headers: { 'Persona-Signature'?: string };
}): Promise<WebhookMessageProcessResult> {
  const data = payload?.body?.data;
  const headers = payload?.headers;

  const inquiryId = data?.attributes?.payload?.data?.id;

  const personaUserKyc = await prisma.personaUserKyc.findFirst({
    where: {
      inquiryId
    }
  });

  if (!personaUserKyc) {
    return {
      success: true,
      message: `Persona user kyc not found with inquiry id ${inquiryId}`
    };
  }

  const spaceId = personaUserKyc.spaceId;

  const personaCredential = await prisma.personaCredential.findUnique({
    where: {
      spaceId
    }
  });

  if (!personaCredential?.apiKey) {
    return {
      success: true,
      spaceIds: [spaceId],
      message: `Persona API key not found for space ${spaceId}`
    };
  }

  if (!personaCredential?.secret) {
    return {
      success: true,
      spaceIds: [spaceId],
      message: `Space does not have a Persona secret ${spaceId}`
    };
  }

  const checkedSignature = checkSignature({
    body: payload.body,
    headers,
    secret: personaCredential.secret
  });

  if (checkedSignature === false) {
    return {
      success: true,
      spaceIds: [spaceId],
      message: `Persona signature not valid for space ${spaceId}`
    };
  }

  await prisma.personaUserKyc.update({
    where: {
      id: personaUserKyc.id
    },
    data: {
      status: data.attributes.payload.data.attributes.status
    }
  });

  return {
    success: true,
    spaceIds: [spaceId],
    message: `Persona event processed for user kyc ${personaUserKyc.id}`
  };
}
