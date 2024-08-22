import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { prisma, Proposal } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { permissionsApiClient } from '../permissions/api/client';
import { getAssignedRoleIds } from '../roles/getAssignedRoleIds';

export type ActionableProposal = {
  id: string;
  title: string;
  currentEvaluation?: {
    id: string;
    type: ProposalEvaluationType;
    dueDate: Date | null;
    title: string;
  };
  isReviewer: boolean;
  isAuthor: boolean;
  updatedAt: Date;
  path: string;
};

export async function getActionableProposals({
  spaceId,
  userId
}: {
  userId: string;
  spaceId: string;
}): Promise<ActionableProposal[]> {
  const ids = await permissionsApiClient.proposals.getAccessibleProposalIds({
    onlyAssigned: true,
    userId,
    spaceId
  });

  const proposals = await prisma.proposal.findMany({
    where: {
      id: {
        in: ids
      },
      page: {
        type: 'proposal',
        deletedAt: null
      }
    },
    select: {
      authors: {
        select: {
          userId: true
        }
      },
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        select: {
          id: true,
          index: true,
          result: true,
          finalStep: true,
          appealedAt: true,
          type: true,
          dueDate: true,
          title: true,
          reviewers: {
            select: {
              userId: true,
              roleId: true,
              systemRole: true
            }
          }
        }
      },
      page: {
        select: {
          title: true,
          id: true,
          updatedAt: true,
          path: true
        }
      }
    }
  });

  const userRoleIds = await getAssignedRoleIds({ spaceId, userId });

  const actionableProposals: ActionableProposal[] = [];

  for (const proposal of proposals) {
    const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
    const isReviewer =
      currentEvaluation &&
      currentEvaluation.reviewers.some((reviewer) => {
        return (
          reviewer.userId === userId ||
          (reviewer.roleId && userRoleIds.includes(reviewer.roleId)) ||
          reviewer.systemRole === 'space_member'
        );
      });
    const isAuthor = proposal.authors.some((author) => author.userId === userId);

    if ((isReviewer || isAuthor) && proposal.page) {
      actionableProposals.push({
        id: proposal.page.id,
        title: proposal.page.title,
        currentEvaluation: currentEvaluation
          ? {
              id: currentEvaluation.id,
              type: currentEvaluation.type,
              dueDate: currentEvaluation.dueDate || null,
              title: currentEvaluation.title
            }
          : undefined,
        isReviewer: !!isReviewer,
        isAuthor,
        updatedAt: proposal.page.updatedAt,
        path: proposal.page.path
      });
    }
  }
  return actionableProposals.sort((a, b) => {
    const proposalADueDate = a.currentEvaluation?.dueDate?.getTime() || 0;
    const proposalBDueDate = b.currentEvaluation?.dueDate?.getTime() || 0;

    if (!proposalADueDate && !proposalBDueDate) {
      return a.updatedAt.getTime() - b.updatedAt.getTime();
    }

    return proposalADueDate - proposalBDueDate;
  });
}
