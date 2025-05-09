import type { PersonaCredential, SynapsCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type KycCredentials = {
  synaps: Omit<SynapsCredential, 'id'> | null;
  persona: Omit<PersonaCredential, 'id'> | null;
};

export async function getKycCredentials(spaceId: string): Promise<KycCredentials> {
  const [synapsCredential, personaCredential] = await prisma.$transaction([
    prisma.synapsCredential.findUnique({
      where: {
        spaceId
      }
    }),
    prisma.personaCredential.findUnique({
      where: {
        spaceId
      }
    })
  ]);

  return { synaps: synapsCredential, persona: personaCredential };
}
