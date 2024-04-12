import { DataNotFoundError, UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { getPersonaInquiryData } from './getPersonaInquiry';
import { initPersonaSession } from './initPersonaInquiry';
import type { PersonaInquiry } from './interfaces';

export async function createPersonaInquiry(spaceId: string, userId: string): Promise<PersonaInquiry> {
  const [personaCredential, personaUserKyc] = await prisma.$transaction([
    prisma.personaCredential.findUnique({
      where: {
        spaceId
      }
    }),
    prisma.personaUserKyc.findUnique({
      where: {
        spaceId,
        userId
      }
    })
  ]);

  if (!personaCredential?.apiKey) {
    throw new DataNotFoundError('Synaps API key not found');
  }

  if (personaUserKyc?.inquiryId) {
    const individualInquiry = await getPersonaInquiryData({
      inquiryId: personaUserKyc.inquiryId,
      apiKey: personaCredential.apiKey
    });

    const isReadOnly = ['pending', 'completed', 'needs_review', 'approved'].includes(
      individualInquiry.data.attributes.status
    );

    if (isReadOnly) {
      throw new UnauthorisedActionError(
        `You can't create a data for this user because of his status: ${individualInquiry.data.attributes.status}`
      );
    }
  }

  const inquiry = await initPersonaSession({ userId, apiKey: personaCredential.apiKey });

  await prisma.personaUserKyc.upsert({
    where: {
      userId,
      spaceId
    },
    create: {
      userId,
      spaceId,
      inquiryId: inquiry.data.id
    },
    update: {
      inquiryId: inquiry.data.id
    }
  });

  return {
    status: inquiry.data.attributes.status,
    inquiryId: inquiry.data.id
  };
}
