import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { CommentUpdate, CommentWithUser } from './interfaces';

export async function updateComment ({ content, id }: CommentUpdate): Promise<CommentWithUser> {

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

  const updateContent = typeof content === 'string' ? JSON.parse(content) : content;

  const updated = await prisma.comment.update({
    where: {
      id
    },
    data: {
      content: updateContent,
      updatedAt: new Date()
    },
    include: {
      user: true
    }
  });

  return updated;

}
