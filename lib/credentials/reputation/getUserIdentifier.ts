import { prisma, type CharmCredential } from '@charmverse/core/prisma-client';

export function getUserIdentifier({ userId }: { userId: string }): Promise<CharmCredential> {
  return prisma.charmCredential.findFirstOrThrow({
    where: {
      userId
    }
  });
}
