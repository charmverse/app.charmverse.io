import { Vote } from '@prisma/client';
import { prisma } from 'db';
import { accessiblePagesByPermissionsQuery } from 'lib/pages/server';
import { calculateVoteStatus } from './calculateVoteStatus';
import { SpaceVotesRequest } from './interfaces';

export async function getVotesBySpace ({ spaceId, userId }: SpaceVotesRequest): Promise<Vote[]> {
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
      voteOptions: true
    }
  });

  return spaceVotes.map(spaceVote => {
    const voteStatus = calculateVoteStatus(spaceVote);
    const userVotes = spaceVote.userVotes;

    delete (spaceVote as any).userVotes;

    return {
      ...spaceVote,
      status: voteStatus,
      totalVotes: userVotes.length
    };
  });
}
