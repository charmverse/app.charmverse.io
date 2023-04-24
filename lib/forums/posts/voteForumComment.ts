import { prisma } from '@charmverse/core';
import type { PostCommentUpDownVote } from '@charmverse/core/dist/prisma';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishPostCommentVoteEvent } from 'lib/webhookPublisher/publishEvent';

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
    const post = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      include: {
        category: true
      }
    });

    const category = post.category;

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

    // Publish webhook event if needed
    await publishPostCommentVoteEvent({
      scope: upvoted ? WebhookEventNames.CommentUpvoted : WebhookEventNames.CommentDownvoted,
      spaceId: post.spaceId,
      commentId,
      postId,
      voterId: userId
    });

    return commentVote;
  }
}
