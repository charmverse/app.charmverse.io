import { prisma } from 'db';
import { UnauthorisedActionError } from 'lib/utilities/errors';

import type { UpdatePageCommentInput } from './interface';

export async function updatePostComment({
  content,
  contentText,
  commentId,
  userId
}: UpdatePageCommentInput & {
  commentId: string;
  userId: string;
}) {
  const comment = await prisma.pageComment.findUnique({
    where: {
      id: commentId
    }
  });

  if (comment?.createdBy !== userId) {
    throw new UnauthorisedActionError();
  }

  return prisma.pageComment.update({
    where: {
      id: commentId
    },
    data: {
      content,
      contentText
    }
  });
}
