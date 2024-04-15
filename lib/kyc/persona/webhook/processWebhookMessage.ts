import { prisma } from '@charmverse/core/prisma-client';

import type { WebhookMessageProcessResult } from 'lib/collabland/webhook/interfaces';

import { getPersonaInquiryData } from '../getPersonaInquiry';
import type { PersonaEventData } from '../interfaces';

import { checkSignature } from './checkSignature';

export async function processWebhookMessage(payload: {
  body: PersonaEventData;
  headers: any;
}): Promise<WebhookMessageProcessResult> {
  const data = payload?.body;

  const inquiryId = data?.data?.attributes?.payload?.data?.id;

  const personaUserKyc = await prisma.personaUserKyc.findFirst({
    where: {
      inquiryId
    },
    include: {
      space: {
        include: {
          personaCredential: true
        }
      }
    }
  });

  if (!personaUserKyc) {
    return {
      success: true,
      message: `Persona user kyc not found with inquiry id ${inquiryId}`
    };
  }

  if (!personaUserKyc.space.personaCredential?.apiKey || !personaUserKyc.space.personaCredential?.secret) {
    return {
      success: true,
      message: `Persona API key not found for space ${personaUserKyc.spaceId}`
    };
  }

  const checkedSignature = checkSignature({
    body: data,
    headers: payload.headers,
    secret: personaUserKyc.space.personaCredential?.secret
  });

  if (!checkedSignature) {
    return {
      success: false,
      message: `Persona signature not valid for space ${personaUserKyc.spaceId}`
    };
  }

  try {
    const individualSession = await getPersonaInquiryData({
      inquiryId: personaUserKyc.inquiryId,
      apiKey: personaUserKyc.space.personaCredential?.apiKey || ''
    });

    if (!individualSession) {
      throw new Error();
    }
  } catch (err) {
    return {
      success: true,
      message: `Persona inquiry not found with inquiry id ${personaUserKyc.inquiryId}`
    };
  }

  await prisma.personaUserKyc.update({
    where: {
      id: personaUserKyc.id
    },
    data: {
      status: data.data.attributes.payload.data.attributes.status
    }
  });

  return {
    success: true,
    message: `Persona event processed for user kyc ${personaUserKyc.id}`
  };
}
