import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { accessiblePagesByPermissionsQuery } from 'lib/pages/server';
import { InvalidInputError } from 'lib/utilities/errors';

import type { ProposalWithUsers } from './interface';
import { generateCategoryIdQuery } from './utils';

export type ListProposalsRequest = {
  spaceId: string;
  userId?: string;
  categoryIds?: string | string[];
};
/**
 * If you want to secure listed categories, make sure to check if the user has access to the category
 * @returns
 */
export async function getProposalsBySpace({
  spaceId,
  categoryIds
}: ListProposalsRequest): Promise<ProposalWithUsers[]> {
  return prisma.proposal.findMany({
    where: {
      spaceId,
      categoryId: categoryIds
        ? {
            in: categoryIds
          }
        : undefined
    },
    include: {
      authors: true,
      reviewers: true,
      category: true
    }
  });
}

export async function getUserProposalsBySpace({
  spaceId,
  userId,
  categoryIds
}: ListProposalsRequest): Promise<ProposalWithUsers[]> {
  if (!userId) {
    return [];
  }

  return prisma.proposal.findMany({
    where: {
      spaceId,
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
        }
      ],
      categoryId: generateCategoryIdQuery(categoryIds)
    },
    include: {
      authors: true,
      reviewers: true,
      category: true
    }
  });
}
