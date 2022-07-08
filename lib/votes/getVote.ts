import { VoteStatus } from '@prisma/client';
import { prisma } from 'db';
import { aggregateVoteResult } from './aggregateVoteResult';
import { calculateVoteStatus } from './calculateVoteStatus';
import { ExtendedVote } from './interfaces';

export async function getVote (id: string, userId: string): Promise<ExtendedVote | null> {
  const vote = await prisma.vote.findUnique({
    where: {
      id
    },
    include: {
      userVotes: {
        include: {
          user: {
            select: {
              avatar: true,
              username: true
            }
          }
        }
      },
      voteOptions: true
    }
  });

  const { aggregatedResult, userChoice } = aggregateVoteResult(vote?.userVotes ?? [], userId);
  const voteStatus = vote ? calculateVoteStatus(vote) : VoteStatus.InProgress;

  if (vote) {
    delete (vote as any).userVotes;
  }

  return vote ? {
    ...vote,
    aggregatedResult,
    userChoice,
    status: voteStatus
  } : null;
}
