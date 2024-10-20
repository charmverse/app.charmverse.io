import { prisma } from '@charmverse/core/prisma-client';

export function deleteRepo({ repoId, deleteIt }: { repoId: number; deleteIt: boolean }) {
  return prisma.githubRepo.update({
    where: { id: repoId },
    data: { deletedAt: deleteIt ? new Date() : null }
  });
}
