import type { PostCommentUpDownVote } from '@prisma/client';

import { prisma } from 'db';

import { getPostComment } from '../comments/getPostComment';

type CommentVote = {
  commentId: string;
  postId: string;
  userId: string;
  upvoted: boolean | null;
};

export async function voteForumComment({
  upvoted,
  userId,
  commentId,
  postId
}: CommentVote): Promise<PostCommentUpDownVote | null> {
  if (upvoted === null) {
    try {
      await prisma.postCommentUpDownVote.delete({
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
    const commentVote = await prisma.postCommentUpDownVote.upsert({
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

    return commentVote;
  }
}
