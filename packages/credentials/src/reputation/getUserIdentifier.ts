import type { CharmUserCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export function getUserIdentifier({ userId }: { userId: string }): Promise<CharmUserCredential | null> {
  return prisma.charmUserCredential.findFirst({
    where: {
      userId
    }
  });
}
