import { prisma } from '@charmverse/core/prisma';

import type { UpdatePostCommentInput } from './interface';

export async function updatePostComment({
  content,
  contentText,
  commentId
}: UpdatePostCommentInput & {
  commentId: string;
}) {
  return prisma.postComment.update({
    where: {
      id: commentId
    },
    data: {
      content,
      contentText: contentText.trim()
    }
  });
}
