import { prisma } from '@charmverse/core/prisma-client';

export async function deleteProjectMember({ projectMemberId }: { projectMemberId: string }) {
  await prisma.projectMember.delete({
    where: {
      id: projectMemberId
    }
  });
}
