import { prisma } from '@charmverse/core/prisma-client';

export async function getProjectsWithMembers() {
  return prisma.project.findMany({
    where: {
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    include: {
      projectMembers: {
        include: {
          user: {
            select: {
              avatar: true
            }
          }
        }
      }
    }
  });
}
