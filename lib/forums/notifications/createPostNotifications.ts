import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

export async function createPostNotification({
  commentId,
  createdBy,
  mentionId,
  postId,
  spaceId,
  userId,
  type
}: {
  type: string;
  mentionId?: string | null;
  spaceId: string;
  userId: string;
  createdBy: string;
  commentId?: string | null;
  postId: string;
}) {
  await prisma.postNotification.create({
    data: {
      type,
      id: v4(),
      mentionId,
      notificationMetadata: {
        create: {
          createdBy,
          spaceId,
          userId
        }
      },
      comment: commentId
        ? {
            connect: {
              id: commentId
            }
          }
        : undefined,
      post: {
        connect: {
          id: postId
        }
      }
    }
  });
}
