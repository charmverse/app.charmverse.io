import { Thread } from '@prisma/client';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { ThreadStatusUpdate, ThreadStatus } from './interfaces';

export async function toggleThreadStatus ({ id, status }: ThreadStatusUpdate): Promise<Thread> {
  if (Object.keys(ThreadStatus).indexOf(status) === -1) {
    throw new InvalidInputError('Provide a valid status for the thread');
  }

  const resolvedStatus = status === 'closed';

  const existingThread = await prisma.thread.findUnique({
    where: {
      id
    },
    select: {
      id: true
    }
  });

  if (!existingThread) {
    throw new DataNotFoundError(`Thread with id ${id} not found.`);
  }

  const updatedThread = await prisma.thread.update({
    where: {
      id
    },
    data: {
      resolved: resolvedStatus
    }
  });

  return updatedThread;
}
