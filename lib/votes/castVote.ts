
import { prisma } from 'db';
import { UserVote } from '@prisma/client';
import { UserVoteDTO } from './interfaces';

export async function castVote (vote: UserVoteDTO): Promise<UserVote> {

  const { choice, userId, voteId } = vote;

  const userVote = await prisma.userVote.upsert({
    where: {
      voteId_userId: {
        voteId,
        userId
      }
    },
    create: {
      userId,
      voteId,
      choice
    },
    update: {
      choice,
      updatedAt: new Date()
    }
  });

  return userVote;
}
