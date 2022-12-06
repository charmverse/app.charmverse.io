import { prisma } from 'db';

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
  return prisma.pageComment.create({
    data: {
      content,
      contentText,
      createdBy: userId,
      pageId: postId,
      parentId
    }
  });
}
