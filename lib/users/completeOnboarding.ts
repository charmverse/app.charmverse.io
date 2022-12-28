import { prisma } from 'db';

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
