import { prisma } from 'db';

export async function completeOnboarding({ spaceId, userId }: { userId: string; spaceId: string }) {
  const workspaceOnboarding = await prisma.workspaceOnboarding.findFirst({
    where: {
      spaceRole: {
        spaceId
      },
      userId
    }
  });

  if (workspaceOnboarding) {
    await prisma.workspaceOnboarding.update({
      data: {
        onboarded: true
      },
      where: {
        userId_spaceRoleId: {
          spaceRoleId: workspaceOnboarding.spaceRoleId,
          userId
        }
      }
    });
  } else {
    const spaceRole = await prisma.spaceRole.findFirst({
      where: {
        spaceId,
        userId
      }
    });
    if (spaceRole) {
      await prisma.workspaceOnboarding.create({
        data: {
          spaceRoleId: spaceRole.id,
          userId,
          onboarded: true
        }
      });
    }
  }
}
