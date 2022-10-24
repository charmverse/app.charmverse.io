import { prisma } from 'db';

import { aggregateVoteResult } from './aggregateVoteResult';
import { calculateVoteStatus } from './calculateVoteStatus';
import type { VoteTask } from './interfaces';

export async function getVoteTasks (userId: string): Promise<VoteTask[]> {
  const votes = await prisma.vote.findMany({
    where: {
      space: {
        spaceRoles: {
          some: {
            userId
          }
        }
      },
      context: 'inline',
      status: 'InProgress'
    },
    orderBy: {
      deadline: 'desc'
    },
    include: {
      page: true,
      space: true,
      userVotes: true,
      voteOptions: true
    }
  });

  const now = new Date();
  const futureVotes = votes.filter(item => item.deadline > now).sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const pastVotes = votes.filter(item => item.deadline <= now);
  const sortedVotes = [...futureVotes, ...pastVotes];

  return sortedVotes.map(vote => {
    const voteStatus = calculateVoteStatus(vote);
    const userVotes = vote.userVotes;
    const { aggregatedResult, userChoice } = aggregateVoteResult({
      userId,
      userVotes,
      voteOptions: vote.voteOptions
    });

    delete (vote as any).userVotes;

    return {
      ...vote,
      aggregatedResult,
      userChoice,
      status: voteStatus,
      totalVotes: userVotes.length
    };
  });
}
