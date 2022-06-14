import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { CommentCreate, CommentWithUser } from './interfaces';

export async function addComment ({ content, threadId, userId }: CommentCreate): Promise<CommentWithUser> {

  if (!content) {
    throw new InvalidInputError('Please provide non-empty content to create a comment');
  }

  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    include: {
      user: true,
      application: true,
      page: true
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  if (!thread.page && !thread.application) {
    throw new DataNotFoundError(`Linked entity for ${threadId} not found`);
  }

  let pageConnect = {};

  if (thread.page) {
    pageConnect = {
      connect: {
        id: thread.pageId
      }
    };
  }

  const createdComment = await prisma.comment.create({
    data: {
      content: content as any,
      thread: {
        connect: {
          id: threadId
        }
      },
      user: {
        connect: {
          id: userId
        }
      },
      space: {
        connect: {
          id: thread.spaceId
        }
      },
      page: pageConnect
    },
    include: {
      user: true
    }
  });

  return createdComment;
}
