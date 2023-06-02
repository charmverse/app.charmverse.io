import { generateCategoryIdQuery } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalWithCommentsAndUsers, ProposalWithUsers } from './interface';

export type ListProposalsRequest = {
  spaceId: string;
  userId?: string;
  categoryIds?: string | string[];
  includePage?: boolean;
};
/**
 * If you want to secure listed categories, make sure to check if the user has access to the category
 * @returns
 */
export async function getProposalsBySpace({
  spaceId,
  categoryIds,
  userId,
  includePage
}: ListProposalsRequest): Promise<(ProposalWithUsers | ProposalWithCommentsAndUsers)[]> {
  return prisma.proposal.findMany({
    where: {
      OR: [
        {
          status: {
            not: 'draft'
          }
        },
        {
          space: {
            spaceRoles: {
              some: {
                spaceId,
                isAdmin: true,
                userId
              }
            }
          }
        }
      ],
      spaceId,
      categoryId: generateCategoryIdQuery(categoryIds),
      page: {
        type: 'proposal'
      }
    },
    include: {
      authors: true,
      reviewers: true,
      category: true,
      ...(includePage
        ? {
            page: {
              include: {
                comments: true
              }
            }
          }
        : {})
    }
  });
}

export async function getUserProposalsBySpace({
  spaceId,
  userId,
  categoryIds,
  includePage
}: ListProposalsRequest): Promise<(ProposalWithUsers | ProposalWithCommentsAndUsers)[]> {
  if (!userId || !spaceId) {
    return [];
  }

  const userSpaceRole = await prisma.spaceRole.findFirst({
    where: {
      userId,
      spaceId
    }
  });

  if (!userSpaceRole) {
    return [];
  }

  return prisma.proposal.findMany({
    where: {
      spaceId,
      page: {
        type: 'proposal'
      },
      OR: [
        {
          createdBy: userId
        },
        {
          authors: {
            some: {
              userId
            }
          }
        },
        {
          reviewers: {
            some: {
              OR: [
                {
                  userId
                },
                {
                  role: {
                    spaceRolesToRole: {
                      some: {
                        spaceRoleId: userSpaceRole.id
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      ],
      categoryId: generateCategoryIdQuery(categoryIds)
    },
    include: {
      authors: true,
      reviewers: true,
      category: true,
      ...(includePage
        ? {
            page: {
              include: {
                comments: true
              }
            }
          }
        : {})
    }
  });
}
