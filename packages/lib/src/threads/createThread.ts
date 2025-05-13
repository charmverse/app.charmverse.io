import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';

import type { ThreadCreatePayload, ThreadWithComments } from './interfaces';
import { threadIncludeClause } from './utils';

export async function createThread({
  comment,
  pageId,
  userId,
  context,
  accessGroups,
  fieldAnswerId
}: ThreadCreatePayload): Promise<ThreadWithComments> {
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
    throw new DataNotFoundError(`Cannot create thread as page with id ${pageId} was not found.`);
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
      fieldAnswer: fieldAnswerId ? { connect: { id: fieldAnswerId } } : undefined,
      accessGroups: accessGroups?.map((ag) => ({ ...ag })) ?? [],
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
    include: threadIncludeClause()
  });

  return thread as unknown as ThreadWithComments;
}
