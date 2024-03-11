import { prisma } from '@charmverse/core/prisma-client';

import { aggregateVoteResult } from './aggregateVoteResult';
import { calculateVoteStatus } from './calculateVoteStatus';
import { getVotingPowerForVotes } from './getVotingPowerForVotes';
import type { ExtendedVote } from './interfaces';

export async function getVotesByPage({
  pageId,
  postId,
  userId
}: {
  pageId?: string;
  postId?: string;
  userId?: string;
}): Promise<ExtendedVote[]> {
  const pageVotes = await prisma.vote.findMany({
    where: {
      pageId,
      postId
    },
    include: {
      userVotes: {
        orderBy: {
          updatedAt: 'desc'
        },
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

  const votingPowers = userId
    ? await getVotingPowerForVotes({
        votes: pageVotes,
        userId
      })
    : [];

  return pageVotes.map((pageVote, index) => {
    const userVotes = pageVote.userVotes?.filter((uv) => uv.choices.length) ?? [];
    const { aggregatedResult, userChoice } = aggregateVoteResult({
      userId,
      userVotes,
      voteOptions: pageVote.voteOptions
    });

    const totalVotes = userVotes.reduce((acc, userVote) => (userVote.tokenAmount ?? 1) + acc, 0);
    const voteStatus = calculateVoteStatus(pageVote);

    delete (pageVote as any).userVotes;

    return {
      ...pageVote,
      aggregatedResult,
      userChoice,
      status: voteStatus,
      totalVotes,
      votingPower: votingPowers[index] ?? 1
    };
  });
}
