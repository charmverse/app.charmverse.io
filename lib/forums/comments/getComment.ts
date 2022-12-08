import { prisma } from 'db';

export function getComment(commentId: string) {
  return prisma.pageComment.findUnique({
    where: {
      id: commentId
    }
  });
}
