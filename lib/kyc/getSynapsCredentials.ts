import { prisma } from '@charmverse/core/prisma-client';

export async function getSynapsCredentials(spaceId: string) {
  const data = await prisma.synapsCredential.findUnique({
    where: {
      spaceId
    }
  });

  return data;
}
