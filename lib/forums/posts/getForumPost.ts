import { prisma } from 'db';
import { PageNotFoundError } from 'lib/pages/server';

import { getPostVoteSummary } from './getPostMeta';
import type { ForumPostPageWithVotes } from './interfaces';

export async function getForumPost({
  pageId,
  userId
}: {
  userId: string;
  pageId: string;
}): Promise<ForumPostPageWithVotes> {
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

  const { post, upDownVotes, ...page } = forumPage;

  const votes = getPostVoteSummary(upDownVotes, userId);

  return {
    ...page,
    post,
    votes
  };
}
