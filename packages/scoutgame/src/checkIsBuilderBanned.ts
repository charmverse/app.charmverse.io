import { prisma } from '@charmverse/core/prisma-client';

export async function checkIsBuilderBanned(builderId: string) {
  const builder = await prisma.scout.findUnique({
    where: {
      id: builderId,
      bannedAt: {
        not: null
      }
    }
  });

  return !!builder;
}
