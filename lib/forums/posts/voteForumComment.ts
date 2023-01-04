import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';

import { getComment } from '../comments/getComment';

type CommentVote = {
  commentId: string;
  postId: string;
  userId: string;
  upvoted: boolean | null;
};

export async function voteForumComment({ upvoted, userId, commentId, postId }: CommentVote) {
  const comment = await getComment(commentId);

  if (!comment) {
    throw new DataNotFoundError(commentId);
  }

  if (upvoted === null) {
    await prisma.postCommentUpDownVote.delete({
      where: {
        createdBy_commentId: {
          createdBy: userId,
          commentId
        }
      }
    });
  } else {
    await prisma.postCommentUpDownVote.upsert({
      create: {
        createdBy: userId,
        upvoted,
        commentId,
        postId
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
