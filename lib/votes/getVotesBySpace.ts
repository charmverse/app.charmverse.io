import { Vote } from '@prisma/client';
import { prisma } from 'db';
import { accessiblePagesByPermissionsQuery } from 'lib/pages/server';
import { aggregateVoteResult } from './aggregateVoteResult';
import { calculateVoteStatus } from './calculateVoteStatus';
import { ExtendedVote, SpaceVotesRequest } from './interfaces';

export async function getVotesBySpace ({ spaceId, userId }: SpaceVotesRequest): Promise<ExtendedVote[]> {
  const spaceVotes = await prisma.vote.findMany({
    where: {
      spaceId,
      page: {
        deletedAt: null,
        OR: [{
          permissions: accessiblePagesByPermissionsQuery({
            spaceId,
            userId
          })
        }, {
          space: {
            spaceRoles: {
              some: {
                spaceId,
                userId,
                isAdmin: true
              }
            }
          }
        }]
      }
    },
    include: {
      userVotes: true,
      voteOptions: true,
      proposal: true
    }
  });

  return spaceVotes.map(spaceVote => {
    const voteStatus = calculateVoteStatus(spaceVote);
    const userVotes = spaceVote.userVotes;
    const { aggregatedResult, userChoice } = aggregateVoteResult({
      userId,
      userVotes,
      voteOptions: spaceVote.voteOptions
    });

    delete (spaceVote as any).userVotes;

    return {
      ...spaceVote,
      aggregatedResult,
      userChoice,
      status: voteStatus,
      totalVotes: userVotes.length
    };
  });
}
