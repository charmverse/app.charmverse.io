import { hasAccessToSpace } from '@charmverse/core/permissions';
import type { Prisma, ProposalStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateCategoryIdQuery } from '@charmverse/core/proposals';
import type { ListProposalsRequest, ProposalWithCommentsAndUsers, ProposalWithUsers } from '@charmverse/core/proposals';
import uniqBy from 'lodash/uniqBy';

function isAuthorQuery({ userId }: { userId: string }): Prisma.ProposalWhereInput[] {
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
    }
  ];
}

export async function getAccessibleProposals({
  spaceId,
  userId,
  categoryIds: requestedCategoryIds,
  onlyAssigned
}: ListProposalsRequest): Promise<ProposalWithUsers[]> {
  const { spaceRole } = await hasAccessToSpace({ spaceId, userId });

  const include: Prisma.ProposalInclude = {
    authors: true,
    reviewers: true,
    category: true
  };

  if (spaceRole?.isAdmin) {
    return prisma.proposal.findMany({
      where: {
        OR: onlyAssigned ? isAuthorQuery({ userId: userId as string }) : undefined,
        spaceId,
        categoryId: requestedCategoryIds ? generateCategoryIdQuery(requestedCategoryIds) : undefined
      },
      include
    }) as Promise<(ProposalWithUsers | ProposalWithCommentsAndUsers)[]>;
  }

  const orQuery: Prisma.ProposalWhereInput[] = [];

  if (spaceRole && onlyAssigned) {
    orQuery.push(...isAuthorQuery({ userId: userId as string }));
  } else if (spaceRole) {
    orQuery.push(
      ...[
        {
          OR: isAuthorQuery({ userId: userId as string })
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
