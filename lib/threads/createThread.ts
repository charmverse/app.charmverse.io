import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

import type { ThreadCreate, ThreadWithComments } from './interfaces';

export async function createThread({ comment, pageId, userId, context }: ThreadCreate): Promise<ThreadWithComments> {
  if (!comment) {
    throw new InvalidInputError('Please provide a valid comment');
  }

  if (!context) {
    throw new InvalidInputError('Please provide a valid context');
  }

  const existingPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  if (!existingPage) {
    throw new DataNotFoundError(`Cannot create thread as linked page with id ${pageId} was not found.`);
  }

  const thread = await prisma.thread.create({
    data: {
      context,
      resolved: false,
      page: {
        connect: {
          id: existingPage.id
        }
      },
      space: {
        connect: {
          id: existingPage.spaceId as string
        }
      },
      user: {
        connect: {
          id: userId
        }
      },
      comments: {
        create: {
          content: comment,
          page: {
            connect: {
              id: existingPage.id
            }
          },
          space: {
            connect: {
              id: existingPage.spaceId as string
            }
          },
          user: {
            connect: {
              id: userId
            }
          }
        }
      }
    },
    include: {
      comments: true
    }
  });

  return thread;
}
