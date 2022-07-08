import { prisma } from 'db';
import { aggregateVoteResult } from './aggregateVoteResult';
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

  if (vote) {
    delete (vote as any).userVotes;
  }

  return vote ? {
    ...vote,
    aggregatedResult,
    userChoice
  } : null;
}
