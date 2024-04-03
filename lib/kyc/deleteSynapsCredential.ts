import { prisma } from '@charmverse/core/prisma-client';

export async function deleteSynapsCredential({ spaceId }: { spaceId: string }) {
  await prisma.synapsCredential.delete({
    where: {
      spaceId
    }
  });
}
