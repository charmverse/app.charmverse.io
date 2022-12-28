import type { Page } from '@prisma/client';

import { prisma } from 'db';
import { PageNotFoundError } from 'lib/pages/server';
import { isUUID } from 'lib/utilities/strings';

import { getPostVoteSummary } from './getPostMeta';
import type { ForumPostPageWithVotes, PageValues } from './interfaces';

export async function getForumPost({
  pageId,
  userId
}: {
  userId: string;
  pageId: string;
}): Promise<ForumPostPageWithVotes> {
  const forumPage = await prisma.page.findFirst({
    where: isUUID(pageId) ? { id: pageId, type: 'post' } : { path: pageId, type: 'post' },
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

  return {
    ...selectPageValues(forumPage),
    post: forumPage.post,
    votes: getPostVoteSummary(forumPage.upDownVotes, userId)
  };
}

// since we can't do the select in the query, we have to do it here
export function selectPageValues(page: Page): PageValues {
  return {
    id: page.id,
    title: page.title,
    content: page.content,
    createdAt: page.createdAt.toString(),
    createdBy: page.createdBy,
    spaceId: page.spaceId,
    updatedAt: page.updatedAt.toString(),
    path: page.path
  };
}
