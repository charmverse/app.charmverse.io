import { PageNotFoundError } from 'next/dist/shared/lib/utils';

import { prisma } from 'db';

import type { ForumPostPageVote } from './interfaces';

export async function voteForumPost({
  upvoted,
  userId,
  postId
}: {
  postId: string;
  userId: string;
  upvoted?: boolean;
}): Promise<ForumPostPageVote> {
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      page: {
        select: {
          spaceId: true,
          createdBy: true,
          id: true
        }
      }
    }
  });

  if (!post || !post.page) {
    throw new PageNotFoundError(postId);
  }

  const pageId = post.page.id;

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

  const page = await prisma.page.findUnique({
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

  if (page) {
    const userVoted = page.upDownVotes.find((vote) => vote.createdBy === userId);
    return {
      downvotes: page.upDownVotes.filter((vote) => !vote.upvoted).length,
      upvotes: page.upDownVotes.filter((vote) => vote.upvoted).length,
      upvoted: userVoted !== undefined ? userVoted.upvoted : undefined
    };
  }

  return {
    downvotes: 0,
    upvotes: 0,
    upvoted: undefined
  };
}
