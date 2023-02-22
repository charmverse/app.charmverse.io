import { prisma } from 'db';
import type { UpdateCommentInput } from 'lib/comments';

export async function updatePageComment({
  content,
  contentText,
  commentId
}: UpdateCommentInput & {
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
