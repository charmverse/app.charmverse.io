import { PageNotFoundError } from 'next/dist/shared/lib/utils';

import { prisma } from 'db';

import { getForumPost } from './getForumPost';
import type { ForumPostPageVote } from './interfaces';

export async function voteForumPost({
  upvoted,
  userId,
  pageId
}: {
  pageId: string;
  userId: string;
  upvoted?: boolean;
}): Promise<ForumPostPageVote> {
  const page = await getForumPost(pageId);

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  if (upvoted === undefined) {
    await prisma.pageUpDownVote.delete({
      where: {
        createdBy_pageId: {
          createdBy: userId,
          pageId
        }
      }
    });
  } else {
    await prisma.pageUpDownVote.upsert({
      create: {
        createdBy: userId,
        upvoted,
        pageId
      },
      update: {
        upvoted
      },
      where: {
        createdBy_pageId: {
          createdBy: userId,
          pageId
        }
      }
    });
  }

  const pageWithVotes = await prisma.page.findUnique({
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
      upvoted: userVoted !== undefined ? userVoted.upvoted : undefined
    };
  }

  return {
    downvotes: 0,
    upvotes: 0,
    upvoted: undefined
  };
}
