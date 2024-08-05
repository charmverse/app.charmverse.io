import { prisma } from '@charmverse/core/prisma-client';

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

  if (!personaCredential?.apiKey || !personaUserKyc?.inquiryId || !personaUserKyc.status) {
    return null;
  }

  return {
    inquiryId: personaUserKyc.inquiryId,
    status: personaUserKyc.status
  };
}
