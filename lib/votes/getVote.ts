import { Vote } from '@prisma/client';
import { prisma } from 'db';

export async function getVote (id: string): Promise<Vote | null> {
  return prisma.vote.findUnique({
    where: {
      id
    }
  });
}
