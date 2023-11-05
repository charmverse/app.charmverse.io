import { prisma } from '@charmverse/core/prisma-client';

import type { PageCommentWithVote } from './interface';

type ListPageCommentsProps = {
  userId?: string;
  pageId: string;
};

export async function listPageComments({ pageId, userId }: ListPageCommentsProps): Promise<PageCommentWithVote[]> {
  const comments = await prisma.pageComment.findMany({
    where: {
      pageId
    },
    include: {
      votes: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return comments.map(({ votes, ...comment }) => {
    let upvoted: boolean | null = null;
    let downvotes = 0;
    let upvotes = 0;

    votes.forEach((vote) => {
      if (vote.upvoted) {
        upvotes += 1;
      } else {
        downvotes += 1;
      }
      if (vote.createdBy === userId) {
        upvoted = vote.upvoted;
      }
    });

    return {
      ...comment,
      upvotes,
      downvotes,
      upvoted
    };
  });
}
