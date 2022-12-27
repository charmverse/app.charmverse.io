import { prisma } from 'db';
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
