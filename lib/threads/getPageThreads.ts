import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utilities/types';

import type { ThreadAccessGroup, ThreadWithComments } from './interfaces';

export async function getPageThreads({ pageId, userId }: { pageId: string; userId: string }) {
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      spaceId: true,
      proposal: {
        select: {
          authors: {
            select: {
              userId: true
            }
          },
          reviewers: {
            select: {
              roleId: true,
              userId: true
            }
          }
        }
      }
    }
  });

  const threads = await prisma.thread.findMany({
    where: {
      pageId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      comments: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  const spaceId = page.spaceId;
  const proposal = page.proposal;
  const spaceRole = await prisma.spaceRole.findFirstOrThrow({
    where: {
      spaceId,
      userId
    },
    select: {
      id: true
    }
  });

  const spaceRoleToRoles = await prisma.spaceRoleToRole.findMany({
    where: {
      spaceRoleId: spaceRole.id
    },
    select: {
      roleId: true
    }
  });

  const spaceRoleIds = spaceRoleToRoles.map((spaceRoleToRole) => spaceRoleToRole.roleId);

  const proposalAuthorIds = proposal?.authors.map((author) => author.userId) || [];
  const proposalReviewerRolesIds = proposal?.reviewers.map((reviewer) => reviewer.roleId).filter(isTruthy) || [];
  const proposalReviewerUserIds = proposal?.reviewers.map((reviewer) => reviewer.userId).filter(isTruthy) || [];
  const filteredThread: ThreadWithComments[] = [];
  const isProposalReviewer =
    proposalReviewerRolesIds.some((roleId) => spaceRoleIds.includes(roleId)) ||
    proposalReviewerUserIds.includes(userId);
  const isProposalAuthor = proposalAuthorIds.includes(userId);
  const isSpaceMember = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    },
    select: {
      id: true
    }
  });

  for (const thread of threads) {
    const threadAccessGroup = thread.accessGroup as unknown as ThreadAccessGroup | undefined;
    if (!threadAccessGroup || thread.userId === userId) {
      filteredThread.push(thread);
    } else if (threadAccessGroup?.group === 'space' && isSpaceMember) {
      filteredThread.push(thread);
    } else if (threadAccessGroup.group === 'authors' && isProposalAuthor) {
      filteredThread.push(thread);
    } else if (threadAccessGroup.group === 'reviewers' && isProposalReviewer) {
      filteredThread.push(thread);
    } else if (
      threadAccessGroup.group === 'role' &&
      threadAccessGroup.id &&
      spaceRoleIds.includes(threadAccessGroup.id)
    ) {
      filteredThread.push(thread);
    } else if (threadAccessGroup.group === 'user' && threadAccessGroup.id === userId) {
      filteredThread.push(thread);
    }
  }

  return filteredThread;
}
