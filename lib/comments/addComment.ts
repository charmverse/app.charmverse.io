import type { Comment } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';

import type { CommentCreate } from './interfaces';

export async function addComment({ content, threadId, userId }: CommentCreate): Promise<Comment> {
  if (!content) {
    throw new InvalidInputError('Please provide non-empty content to create a comment');
  }

  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    select: {
      spaceId: true,
      pageId: true,
      page: {
        select: {
          id: true
        }
      }
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  if (!thread.page) {
    throw new DataNotFoundError(`Linked page for ${threadId} not found`);
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
      page: {
        connect: {
          id: thread.pageId
        }
      }
    }
  });

  return createdComment;
}
