import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

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
    },
    include: {
      user: {
        select: {
          id: true,
          avatar: true,
          username: true
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

  // // Publish webhook event if needed
  // await publishWebhookEvent(thread.spaceId, {
  //   scope: WebhookEventNames.CommentCreated,
  //   comment: {
  //     createdAt: createdComment.createdAt.toISOString(),
  //     id: createdComment.id,
  //     threadId: createdComment.threadId,
  //     parentId: createdComment.parentId || null,
  //     author: {
  //       wallet: '',
  //       avatar: createdComment.user.avatar,
  //       username: createdComment.user.username
  //     }
  //   },
  //   discussion: {
  //     id: thread
  //   }
  // });

  return comment;
}
