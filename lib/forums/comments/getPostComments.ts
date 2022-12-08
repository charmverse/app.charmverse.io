import { prisma } from 'db';

import type { PostCommentWithVote } from './interface';

export async function getPostComments({
  postId,
  userId
}: {
  userId: string;
  postId: string;
}): Promise<PostCommentWithVote[]> {
  const comments = await prisma.pageComment.findMany({
    where: {
      pageId: postId
    },
    include: {
      votes: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return comments.map((comment) => {
    let upvoted: boolean | null = null;
    let downvotes = 0;
    let upvotes = 0;

    comment.votes.forEach((vote) => {
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
