import { prisma } from '@charmverse/core/prisma-client';

export async function completeOnboarding({ spaceId, userId }: { userId: string; spaceId: string }) {
  await prisma.spaceRole.updateMany({
    where: {
      spaceId,
      userId
    },
    data: {
      onboarded: true
    }
  });
}
