import { prisma } from '@charmverse/core/prisma-client';
import type { ThreadWithComments } from '@packages/lib/threads/interfaces';

import { threadIncludeClause } from './utils';

export async function getPageThreads({
  pageId,
  userId
}: {
  pageId: string;
  userId: string;
}): Promise<ThreadWithComments[]> {
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
      pageId,
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
    },
    include: threadIncludeClause()
  });

  return accessibleThreads as unknown as ThreadWithComments[];
}
