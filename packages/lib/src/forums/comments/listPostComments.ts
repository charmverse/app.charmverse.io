import { prisma } from '@charmverse/core/prisma-client';

import type { PostCommentWithVote } from './interface';

type ListPostCommentsRequest = {
  userId?: string;
  postId: string;
};

export async function listPostComments({ postId, userId }: ListPostCommentsRequest): Promise<PostCommentWithVote[]> {
  const comments = await prisma.postComment.findMany({
    where: {
      postId
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
