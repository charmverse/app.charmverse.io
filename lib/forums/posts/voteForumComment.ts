import type { PostCommentUpDownVote } from '@prisma/client';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

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
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        category: true
      }
    });

    const category = post?.category;

    if (category) {
      trackUserAction(upvoted ? 'upvote_comment' : 'downvote_comment', {
        resourceId: commentId,
        spaceId: post.spaceId,
        userId,
        categoryName: category.name,
        postId: post.id
      });
    }

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
