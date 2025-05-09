import type { Comment } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';

import type { CommentUpdate } from './interfaces';

export async function updateComment({ content, id }: CommentUpdate): Promise<Comment> {
  if (!content) {
    throw new InvalidInputError('Please provide a non empty input to update this comment.');
  }

  const existingComment = await prisma.comment.findUnique({
    where: {
      id
    },
    select: {
      id: true
    }
  });

  if (!existingComment) {
    throw new DataNotFoundError(`Comment with id ${id} not found`);
  }

  const updated = await prisma.comment.update({
    where: {
      id
    },
    data: {
      content,
      updatedAt: new Date()
    }
  });

  return updated;
}
