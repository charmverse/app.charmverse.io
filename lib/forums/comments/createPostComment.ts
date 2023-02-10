import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { WebhookEventNames } from 'lib/webhook/interfaces';
import { publishPostCommentEvent } from 'lib/webhook/publishEvent';

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
  const post = await prisma.post.findUniqueOrThrow({
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

  const category = post.category;

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

  // Publish webhook event if needed
  await publishPostCommentEvent({
    scope: WebhookEventNames.CommentCreated,
    spaceId: post.spaceId,
    commentId: comment.id,
    postId
  });

  return comment;
}
