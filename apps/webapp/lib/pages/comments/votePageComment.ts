import type { PageCommentVote } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

type CommentVote = {
  commentId: string;
  pageId: string;
  userId: string;
  upvoted: boolean | null;
};

export async function votePageComment({
  upvoted,
  userId,
  commentId,
  pageId
}: CommentVote): Promise<PageCommentVote | null> {
  if (upvoted === null) {
    try {
      await prisma.pageCommentVote.delete({
        where: {
          createdBy_commentId: {
            createdBy: userId,
            commentId
          }
        }
      });
    } catch (error) {
      // Comment not found
    }

    return null;
  } else {
    await prisma.page.findUniqueOrThrow({
      where: { id: pageId }
    });

    const commentVote = await prisma.pageCommentVote.upsert({
      create: {
        createdBy: userId,
        upvoted,
        commentId
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

    return commentVote;
  }
}
