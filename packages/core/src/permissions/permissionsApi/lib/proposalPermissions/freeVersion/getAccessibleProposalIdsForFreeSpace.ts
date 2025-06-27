import type { Prisma, ProposalEvaluation, ProposalReviewer, ProposalStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { hasAccessToSpace, isProposalAuthor } from '@packages/core/permissions';
import type { ListProposalsRequest } from '@packages/core/proposals';
import { getCurrentEvaluation } from '@packages/core/proposals';
import { arrayUtils } from '@packages/core/utilities';

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

export async function getAccessibleProposalIdsForFreeSpace({
  spaceId,
  userId,
  onlyAssigned
}: ListProposalsRequest): Promise<string[]> {
  const { spaceRole } = await hasAccessToSpace({ spaceId, userId });

  if (spaceRole?.isAdmin) {
    const adminProposals = await prisma.proposal.findMany({
      where: {
        OR: onlyAssigned
          ? [...isAuthorQuery({ userId: userId as string }), { reviewers: { some: { userId } } }]
          : undefined,
        spaceId
      },
      select: {
        id: true,
        authors: true,
        reviewers: true,
        createdBy: true,
        evaluations: onlyAssigned
          ? {
              select: {
                result: true,
                index: true,
                reviewers: true,
                finalStep: true,
                appealedAt: true
              }
            }
          : undefined
      }
    });

    const returnedProposals = onlyAssigned
      ? adminProposals.filter((proposal) => {
          const isAuthor = isProposalAuthor({ proposal, userId });

          if (isAuthor) {
            return true;
          }
          const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
          if (!currentEvaluation) {
            log.warn('No evaluation found for proposal', { spaceId, proposalId: proposal.id, pageId: proposal.id });
            return false;
          }
          return (currentEvaluation as ProposalEvaluation & { reviewers: ProposalReviewer[] }).reviewers.some(
            (r) => r.userId === userId
          );
        })
      : adminProposals;

    return arrayUtils.extractUuids(returnedProposals);
  }

  const orQuery: Prisma.ProposalWhereInput[] = [];

  if (spaceRole && onlyAssigned) {
    orQuery.push(...isAuthorQuery({ userId: userId as string }), {
      status: { not: 'draft' },
      reviewers: { some: { userId } }
    });
  } else if (spaceRole) {
    orQuery.push(
      {
        OR: isAuthorQuery({ userId: userId as string })
      },
      {
        status: {
          not: 'draft' as ProposalStatus
        }
      }
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
    OR: orQuery
  };

  const proposals = await prisma.proposal.findMany({
    where: {
      ...query,
      OR: orQuery
    },
    select: {
      id: true,
      authors: true,
      reviewers: true,
      createdBy: true,
      evaluations: onlyAssigned
        ? {
            select: {
              result: true,
              index: true,
              reviewers: true,
              finalStep: true,
              appealedAt: true
            }
          }
        : undefined
    }
  });

  const returnedProposals = onlyAssigned
    ? proposals.filter((proposal) => {
        const isAuthor = isProposalAuthor({ proposal, userId });

        if (isAuthor) {
          return true;
        }

        const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
        if (!currentEvaluation) {
          log.warn('No evaluation found for proposal', { spaceId, proposalId: proposal.id, pageId: proposal.id });
          return false;
        }
        return (currentEvaluation as ProposalEvaluation & { reviewers: ProposalReviewer[] }).reviewers.some(
          (r) => r.userId === userId
        );
      })
    : proposals;

  return arrayUtils.extractUuids(returnedProposals);
}
