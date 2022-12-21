import { prisma } from 'db';
import { PageNotFoundError } from 'lib/pages/server';

import type { ForumPostPage } from './interfaces';

export async function getForumPost({ pageId, userId }: { userId?: string; pageId: string }): Promise<ForumPostPage> {
  const forumPage = await prisma.page.findFirst({
    where: { id: pageId, type: 'post' },
    include: {
      post: true,
      upDownVotes: {
        select: {
          upvoted: true,
          createdBy: true
        }
      }
    }
  });

  if (!forumPage || !forumPage.post) {
    throw new PageNotFoundError(pageId);
  }

  const { upDownVotes, post } = forumPage;

  const userVote = forumPage.upDownVotes.find((vote) => vote.createdBy === userId);

  return {
    ...forumPage,
    post: {
      ...post,
      downvotes: upDownVotes.filter((vote) => !vote.upvoted).length,
      upvotes: upDownVotes.filter((vote) => vote.upvoted).length,
      upvoted: userVote ? userVote.upvoted : undefined
    }
  };
}
