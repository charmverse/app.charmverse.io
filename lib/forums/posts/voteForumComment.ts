import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { DataNotFoundError } from 'lib/utilities/errors';

import { getComment } from '../comments/getComment';

export async function voteForumComment({
  upvoted,
  userId,
  commentId,
  pageId
}: {
  commentId: string;
  pageId: string;
  userId: string;
  upvoted: boolean | null;
}) {
  const comment = await getComment(commentId);

  if (!comment) {
    throw new DataNotFoundError(commentId);
  }

  if (upvoted === null) {
    await prisma.pageCommentUpDownVote.delete({
      where: {
        createdBy_commentId: {
          createdBy: userId,
          commentId
        }
      }
    });
  } else {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        post: {
          include: {
            category: true
          }
        }
      }
    });

    const category = page?.post?.category;

    if (category) {
      if (upvoted) {
        trackUserAction('upvote_comment', {
          resourceId: commentId,
          spaceId: page.spaceId,
          userId,
          categoryName: category.name,
          postId: page.id
        });
      } else {
        trackUserAction('downvote_comment', {
          resourceId: commentId,
          spaceId: page.spaceId,
          userId,
          categoryName: category.name,
          postId: page.id
        });
      }
    }

    await prisma.pageCommentUpDownVote.upsert({
      create: {
        createdBy: userId,
        upvoted,
        commentId,
        pageId
      },
      update: {
        upvoted
      },
      where: {
        createdBy_commentId: {
          createdBy: userId,
          commentId
        }
      }
    });
  }
}
