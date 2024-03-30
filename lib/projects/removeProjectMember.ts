import { prisma } from '@charmverse/core/prisma-client';

export async function removeProjectMember({ projectId, memberId }: { projectId: string; memberId: string }) {
  await prisma.projectMember.delete({
    where: {
      projectId,
      id: memberId
    }
  });
}
