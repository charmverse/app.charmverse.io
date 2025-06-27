import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, UnauthorisedActionError } from '@packages/core/errors';

import { initPersonaInquiry } from './initPersonaInquiry';
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
    const status = personaUserKyc.status;

    const isReadOnly = ['pending', 'completed', 'needs_review', 'approved'].includes(status || '');

    if (isReadOnly) {
      throw new UnauthorisedActionError(`You can't create a data for this user because of his status: ${status}`);
    }
  }

  const inquiry = await initPersonaInquiry({
    userId,
    apiKey: personaCredential.apiKey,
    templateId: personaCredential.templateId
  });

  await prisma.personaUserKyc.upsert({
    where: {
      userId,
      spaceId
    },
    create: {
      userId,
      spaceId,
      inquiryId: inquiry.data.id,
      status: inquiry.data.attributes.status || 'created'
    },
    update: {
      inquiryId: inquiry.data.id,
      status: inquiry.data.attributes.status || 'created'
    }
  });

  return {
    status: inquiry.data.attributes.status,
    inquiryId: inquiry.data.id
  };
}
