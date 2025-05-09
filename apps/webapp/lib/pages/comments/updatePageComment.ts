import { prisma } from '@charmverse/core/prisma-client';
import type { UpdateCommentInput } from '@packages/lib/comments';

export async function updatePageComment({
  content,
  contentText,
  commentId,
  lensCommentLink
}: UpdateCommentInput & {
  commentId: string;
}) {
  return prisma.pageComment.update({
    where: {
      id: commentId
    },
    data: {
      lensCommentLink,
      content,
      contentText: contentText ? contentText.trim() : undefined
    }
  });
}
