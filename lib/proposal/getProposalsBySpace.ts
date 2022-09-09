import { prisma } from 'db';
import { accessiblePagesByPermissionsQuery } from 'lib/pages/server';
import { ProposalWithUsers } from './interface';

export async function getProposalsBySpace ({ spaceId, userId }: {
  spaceId: string
  userId: string
}): Promise<ProposalWithUsers[]> {
  return prisma.proposal.findMany({
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
      authors: true,
      reviewers: true
    }
  });
}
