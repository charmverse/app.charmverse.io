import { prisma } from '@charmverse/core/prisma-client';

import type { ForumPostVotes } from './interfaces';

export async function getPostVote({
  pageId,
  userId
}: {
  pageId: string;
  userId: string;
}): Promise<ForumPostVotes | null> {
  const pageWithVotes = await prisma.post.findUnique({
    where: {
      id: pageId
    },
    select: {
      upDownVotes: {
        select: {
          upvoted: true,
          createdBy: true
        }
      }
    }
  });

  if (pageWithVotes) {
    const userVoted = pageWithVotes.upDownVotes.find((vote) => vote.createdBy === userId);
    return {
      downvotes: pageWithVotes.upDownVotes.filter((vote) => !vote.upvoted).length,
      upvotes: pageWithVotes.upDownVotes.filter((vote) => vote.upvoted).length,
      upvoted: userVoted !== undefined ? userVoted.upvoted : null
    };
  }

  return null;
}
