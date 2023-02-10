import { WebhookEventNames } from 'serverless/webhook/interfaces';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { publishWebhookEvent } from 'lib/webhook/publishEvent';

import type { CreatePostCommentInput } from './interface';

export async function createPostComment({
  content,
  contentText,
  parentId,
  postId,
  userId
}: CreatePostCommentInput & {
  postId: string;
  userId: string;
}) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      category: true
    }
  });

  const comment = await prisma.postComment.create({
    data: {
      content,
      contentText: contentText.trim(),
      parentId,
      user: {
        connect: {
          id: userId
        }
      },
      post: {
        connect: {
          id: postId
        }
      }
    }
  });

  const category = post?.category;

  if (category) {
    trackUserAction('create_comment', {
      categoryName: category.name,
      commentedOn: parentId === postId ? 'post' : 'comment',
      postId,
      resourceId: comment.id,
      spaceId: post.spaceId,
      userId
    });
  }

  if (post) {
    // Publish webhook event if needed
    await publishWebhookEvent(
      { scope: WebhookEventNames.CommentCreated, spaceId: post.spaceId, userId },
      ({ user, space }) => ({
        comment: {
          createdAt: comment.createdAt.toISOString(),
          id: comment.id,
          threadId: postId,
          parentId: parentId ?? null,
          space,
          author: user
        },
        discussion: null,
        space
      })
    );
  }

  return comment;
}
