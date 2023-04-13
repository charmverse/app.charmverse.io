import { prisma } from 'db';

import { aggregateVoteResult } from './aggregateVoteResult';
import { calculateVoteStatus } from './calculateVoteStatus';
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

  return pageVotes.map((pageVote) => {
    const userVotes = pageVote.userVotes;
    const { aggregatedResult, userChoice } = aggregateVoteResult({
      userId,
      userVotes,
      voteOptions: pageVote.voteOptions
    });

    const voteStatus = calculateVoteStatus(pageVote);

    delete (pageVote as any).userVotes;

    return {
      ...pageVote,
      aggregatedResult,
      userChoice,
      status: voteStatus,
      totalVotes: userVotes.length
    };
  });
}
