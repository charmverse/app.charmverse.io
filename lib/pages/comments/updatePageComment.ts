import { prisma } from 'db';

import type { UpdatePageCommentInput } from './interface';

export async function updatePageComment({
  content,
  contentText,
  commentId
}: UpdatePageCommentInput & {
  commentId: string;
}) {
  return prisma.pageComment.update({
    where: {
      id: commentId
    },
    data: {
      content,
      contentText: contentText.trim()
    }
  });
}
