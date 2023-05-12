import type { ListProposalsRequest, ProposalWithCommentsAndUsers, ProposalWithUsers } from '@charmverse/core';
import { generateCategoryIdQuery, hasAccessToSpace, prisma } from '@charmverse/core';
import type { Prisma, ProposalStatus, SpaceRole } from '@charmverse/core/prisma';
import uniqBy from 'lodash/uniqBy';

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
  categoryIds: requestedCategoryIds,
  includePage,
  onlyAssigned
}: ListProposalsRequest): Promise<(ProposalWithUsers | ProposalWithCommentsAndUsers)[]> {
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
        OR: onlyAssigned ? isReviewerOrAuthorQuery({ userId: userId as string, spaceRole }) : undefined,
        spaceId,
        categoryId: requestedCategoryIds ? generateCategoryIdQuery(requestedCategoryIds) : undefined
      },
      include
    }) as Promise<(ProposalWithUsers | ProposalWithCommentsAndUsers)[]>;
  }

  const orQuery: Prisma.ProposalWhereInput[] = [];

  if (spaceRole && onlyAssigned) {
    orQuery.push(...isReviewerOrAuthorQuery({ userId: userId as string, spaceRole }));
  } else if (spaceRole) {
    orQuery.push(
      ...[
        {
          OR: isReviewerOrAuthorQuery({ userId: userId as string, spaceRole })
        },
        {
          status: {
            not: 'draft' as ProposalStatus
          }
        }
      ]
    );
  } else {
    orQuery.push({
      status: {
        not: 'draft' as ProposalStatus
      }
    });
  }
  const query: Prisma.ProposalWhereInput = {
    spaceId,
    page: {
      type: 'proposal'
    },
    categoryId: requestedCategoryIds ? generateCategoryIdQuery(requestedCategoryIds) : undefined,
    OR: orQuery
  };

  const proposals = (await prisma.proposal.findMany({
    where: {
      ...query,
      OR: orQuery
    },
    include
  })) as (ProposalWithUsers | ProposalWithCommentsAndUsers)[];

  return uniqBy(proposals, 'id');
}
