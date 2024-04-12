import { prisma } from '@charmverse/core/prisma-client';

import { getPersonaInquiryData } from './getPersonaInquiry';
import type { PersonaInquiry } from './interfaces';

export async function getPersonaInquiryDetails(spaceId: string, userId: string): Promise<PersonaInquiry | null> {
  const [personaCredential, personaUserKyc] = await prisma.$transaction([
    prisma.personaCredential.findUnique({
      where: {
        spaceId
      }
    }),
    prisma.personaUserKyc.findFirst({
      where: {
        userId,
        spaceId
      }
    })
  ]);

  if (!personaCredential?.apiKey) {
    return null;
  }

  if (!personaUserKyc?.inquiryId) {
    return null;
  }

  const inquiry = await getPersonaInquiryData({
    inquiryId: personaUserKyc.inquiryId,
    apiKey: personaCredential.apiKey
  });

  return {
    inquiryId: inquiry.data.id,
    status: inquiry.data.attributes.status,
    sandbox: false // @TODO check to see if I can get the sandbox status from the API
  };
}
