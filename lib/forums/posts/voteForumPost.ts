import { PageNotFoundError } from 'next/dist/shared/lib/utils';

import { prisma } from 'db';
import type { MixpanelEventName } from 'lib/metrics/mixpanel/interfaces';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

export async function voteForumPost({
  upvoted,
  userId,
  pageId
}: {
  pageId: string;
  userId: string;
  upvoted: boolean | null;
}) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      post: true
    }
  });

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
      const userAction: MixpanelEventName = upvoted ? 'upvote_post' : 'downvote_post';
      trackUserAction(userAction, {
        resourceId: page.id,
        spaceId: page.spaceId,
        userId,
        categoryName: category.name
      });
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
