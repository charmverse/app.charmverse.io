import { VoteStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { aggregateVoteResult } from './aggregateVoteResult';
import { calculateVoteStatus } from './calculateVoteStatus';
import { getVotingPowerForVotes } from './getVotingPowerForVotes';
import type { ExtendedVote } from './interfaces';

export async function getVote(id: string, userId?: string): Promise<ExtendedVote | null> {
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

  // filter empty votes
  const userVotes = vote?.userVotes.filter((uv) => uv.choices.length) ?? [];
  const { aggregatedResult, userChoice } = aggregateVoteResult({
    userId,
    userVotes,
    voteOptions: vote?.voteOptions ?? []
  });

  const voteStatus = vote ? calculateVoteStatus(vote) : VoteStatus.InProgress;

  if (vote) {
    delete (vote as any).userVotes;
  }

  return vote
    ? {
        ...vote,
        votingPower: (
          await getVotingPowerForVotes({
            userId: vote.createdBy,
            votes: [vote]
          })
        )[0],
        aggregatedResult,
        userChoice,
        status: voteStatus,
        totalVotes: userVotes.length
      }
    : null;
}
