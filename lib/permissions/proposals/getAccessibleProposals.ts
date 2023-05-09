import type { ListProposalsRequest, ProposalWithCommentsAndUsers, ProposalWithUsers } from '@charmverse/core';
import { prisma, generateCategoryIdQuery, hasAccessToSpace } from '@charmverse/core';
import type { Prisma, SpaceRole } from '@charmverse/core/prisma';
import uniqBy from 'lodash/uniqBy';

import { getAccessibleProposalCategories } from './getAccessibleProposalCategories';

function isReviewerOrAuthorQuery({
  userId,
  spaceRole
}: {
  userId: string;
  spaceRole: SpaceRole;
}): Prisma.ProposalWhereInput[] {
  return [
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
                    spaceRoleId: spaceRole.id
                  }
                }
              }
            }
          ]
        }
      }
    }
  ];
}

export async function getAccessibleProposals({
  spaceId,
  userId,
  categoryIds,
  includePage,
  onlyAssigned
}: ListProposalsRequest): Promise<(ProposalWithUsers | ProposalWithCommentsAndUsers)[]> {
  // If no category ids are provided, use the accessible categories, otherwise use the subset of accessible categories from the query
  const queryCategoryIds = categoryIds ? generateCategoryIdQuery(categoryIds) : undefined;

  const { spaceRole } = await hasAccessToSpace({ spaceId, userId });

  const include: Prisma.ProposalInclude = {
    authors: true,
    reviewers: true,
    category: true,
    page: includePage
      ? {
          include: {
            comments: true
          }
        }
      : false
  };

  if (spaceRole?.isAdmin) {
    return prisma.proposal.findMany({
      where: {
        OR: onlyAssigned && userId ? isReviewerOrAuthorQuery({ userId, spaceRole }) : undefined,
        spaceId,
        categoryId: queryCategoryIds
      },
      include
    }) as Promise<(ProposalWithUsers | ProposalWithCommentsAndUsers)[]>;
  }

  const orQuery: Prisma.ProposalWhereInput[] = [];

  // Only search by category if there are accessible categories and we are not restricting to only proposals where they are a reviewer or author
  if (queryCategoryIds && !onlyAssigned) {
    orQuery.push({
      status: {
        not: 'draft'
      },
      categoryId: queryCategoryIds
    });
  }

  // Also search for proposals where user is an author or reviewer
  if (spaceRole) {
    orQuery.push({
      OR: isReviewerOrAuthorQuery({ userId: userId as string, spaceRole })
    });
  }
  const query: Prisma.ProposalWhereInput = {
    spaceId,
    page: {
      type: 'proposal'
    },
    OR: onlyAssigned && spaceRole ? isReviewerOrAuthorQuery({ spaceRole, userId: userId as string }) : orQuery
  };

  const proposals = (await prisma.proposal.findMany({
    where: query,
    include
  })) as (ProposalWithUsers | ProposalWithCommentsAndUsers)[];

  return uniqBy(proposals, 'id');
}
