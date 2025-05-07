import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';

export async function deleteThread(threadId: string): Promise<true> {
  const existingThread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    select: {
      id: true
    }
  });

  if (!existingThread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  await prisma.thread.delete({
    where: {
      id: threadId
    }
  });

  return true;
}
