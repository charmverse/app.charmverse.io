import { prisma } from '@charmverse/core/prisma-client';

export async function getPageThreads({ pageId, userId }: { pageId: string; userId: string }) {
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  const spaceId = page.spaceId;
  const spaceRole = await prisma.spaceRole.findFirstOrThrow({
    where: {
      spaceId,
      userId
    },
    select: {
      spaceRoleToRole: {
        select: {
          roleId: true
        }
      }
    }
  });

  const spaceRoleIds = spaceRole.spaceRoleToRole.map((spaceRoleToRole) => spaceRoleToRole.roleId);

  const accessibleThreads = await prisma.thread.findMany({
    where: {
      OR: [
        {
          userId
        },
        {
          accessGroups: {
            isEmpty: true
          }
        },
        {
          accessGroups: {
            has: {
              group: 'user',
              id: userId
            }
          }
        },
        {
          accessGroups: {
            hasSome: spaceRoleIds.map((spaceRoleId) => ({ group: 'role', id: spaceRoleId }))
          }
        }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return accessibleThreads;
}
