import { prisma } from 'db';

export async function hasOnBoardedWorkspace({ spaceId, userId }: { userId: string; spaceId: string }) {
  const workspaceOnBoarded = await prisma.workspaceOnboard.findFirst({
    where: {
      userId,
      spaceRole: {
        spaceId
      }
    }
  });

  return workspaceOnBoarded?.onboarded ?? false;
}
