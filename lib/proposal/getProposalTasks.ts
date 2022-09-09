import { prisma } from 'db';
import { accessiblePagesByPermissionsQuery } from 'lib/pages/server';
import { ExtendedProposal } from './interface';

export async function getProposalTasks (userId: string): Promise<ExtendedProposal[]> {
  // Get all the space the user is part of
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true
    }
  });

  const spaceIds = spaceRoles.map(spaceRole => spaceRole.spaceId);

  const proposals = (await Promise.all(spaceIds.map(spaceId => prisma.proposal.findMany({
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
      page: true,
      space: true,
      authors: true,
      reviewers: true
    }
  })))).flat();

  return proposals as ExtendedProposal[];
}
