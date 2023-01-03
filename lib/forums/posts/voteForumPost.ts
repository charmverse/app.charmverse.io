import { PageNotFoundError } from 'next/dist/shared/lib/utils';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

import { getForumPost } from './getForumPost';

export async function voteForumPost({
  upvoted,
  userId,
  pageId
}: {
  pageId: string;
  userId: string;
  upvoted: boolean | null;
}) {
  const page = await getForumPost({ pageId, userId });

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  if (upvoted === null) {
    await prisma.pageUpDownVote.delete({
      where: {
        createdBy_pageId: {
          createdBy: userId,
          pageId
        }
      }
    });
  } else {
    const category = await prisma.postCategory.findUnique({
      where: {
        id: page.post.categoryId
      },
      select: {
        name: true
      }
    });

    if (category) {
      if (upvoted) {
        trackUserAction('upvote_post', {
          resourceId: page.id,
          spaceId: page.spaceId,
          userId,
          categoryName: category.name
        });
      } else {
        trackUserAction('downvote_post', {
          resourceId: page.id,
          spaceId: page.spaceId,
          userId,
          categoryName: category.name
        });
      }
    }
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
}
