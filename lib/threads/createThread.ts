import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { ThreadCreate, ThreadWithCommentsAndAuthors } from './interfaces';

export async function createThread ({ applicationId, comment, pageId, userId, context }: ThreadCreate)
: Promise<ThreadWithCommentsAndAuthors> {

  if (!comment) {
    throw new InvalidInputError('Please provide a valid comment');
  }

  if (pageId && !context) {
    throw new InvalidInputError('Please provide a valid context');
  }

  let existingPage;
  let pageConnect = {};
  let application;
  let applicationConnect = {};

  if (pageId) {
    existingPage = await prisma.page.findUnique({
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
    pageConnect = {
      connect: {
        id: existingPage.id
      }
    };
  }

  if (applicationId) {
    application = await prisma.application.findUnique({
      where: {
        id: applicationId
      },
      select: {
        id: true,
        spaceId: true
      }
    });

    if (!application) {
      throw new DataNotFoundError(`Cannot create thread as linked application with id ${applicationId} was not found.`);
    }

    applicationConnect = {
      connect: {
        id: applicationId
      }
    };
  }

  const spaceConnect = {
    connect: {
      id: (application && application.spaceId) || (existingPage && existingPage.spaceId as string)
    }
  };

  const thread = await prisma.thread.create({
    data: {
      context,
      resolved: false,
      page: pageConnect,
      space: spaceConnect,
      application: applicationConnect,
      user: {
        connect: {
          id: userId
        }
      },
      comments: {
        create: {
          content: comment,
          page: pageConnect,
          space: spaceConnect,
          user: {
            connect: {
              id: userId
            }
          }
        }
      }
    },
    include: {
      comments: {
        include: {
          user: true
        }
      }
    }
  });

  return thread;
}
