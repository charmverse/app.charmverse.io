import type { ProposalEvaluationResult, ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { permissionsApiClient } from '../permissions/api/client';
import { getAssignedRoleIds } from '../roles/getAssignedRoleIds';

type CurrentEvaluation = {
  id: string;
  type: ProposalEvaluationType;
  dueDate: Date | null;
  title: string;
  result: ProposalEvaluationResult | null;
};

type UserProposalBase = {
  id: string;
  title: string;
  updatedAt: Date;
  path: string;
  status: ProposalStatus;
  currentEvaluation?: CurrentEvaluation;
};

export type ActionableUserProposal = UserProposalBase & {
  currentEvaluation: CurrentEvaluation;
};

export type AuthoredUserProposal = UserProposalBase & {
  currentEvaluation?: CurrentEvaluation;
};

export type AssignedUserProposal = UserProposalBase & {
  currentEvaluation?: CurrentEvaluation;
};

export type GetUserProposalsResponse = {
  actionable: ActionableUserProposal[];
  authored: AuthoredUserProposal[];
  assigned: AssignedUserProposal[];
};

export async function getUserProposals({
  spaceId,
  userId
}: {
  userId: string;
  spaceId: string;
}): Promise<GetUserProposalsResponse> {
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
      status: true,
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
          reviews: {
            select: {
              reviewerId: true
            }
          },
          vote: {
            select: {
              userVotes: {
                select: {
                  userId: true
                }
              }
            }
          },
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

  const actionableProposals: GetUserProposalsResponse['actionable'] = [];
  const authoredProposals: GetUserProposalsResponse['authored'] = [];
  const assignedProposals: GetUserProposalsResponse['assigned'] = [];

  for (const proposal of proposals) {
    const isAuthor = proposal.authors.some((author) => author.userId === userId);
    if (proposal.page) {
      if (proposal.status === 'draft') {
        if (isAuthor) {
          authoredProposals.push({
            id: proposal.page.id,
            title: proposal.page.title,
            currentEvaluation: undefined,
            path: proposal.page.path,
            updatedAt: proposal.page.updatedAt,
            status: proposal.status
          });
        }
      } else {
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

        const hasReviewed = currentEvaluation?.reviews.some((review) => review.reviewerId === userId);

        const actionableProposal = {
          id: proposal.page.id,
          title: proposal.page.title,
          currentEvaluation: currentEvaluation
            ? {
                id: currentEvaluation.id,
                type: currentEvaluation.type,
                dueDate: currentEvaluation.dueDate || null,
                title: currentEvaluation.title,
                result: currentEvaluation.result || null
              }
            : undefined,
          updatedAt: proposal.page.updatedAt,
          path: proposal.page.path,
          status: proposal.status
        };

        const hasVoted =
          currentEvaluation?.type === 'vote' &&
          currentEvaluation.vote?.userVotes.some((vote) => vote.userId === userId);

        if (isReviewer && !currentEvaluation.result && !hasVoted && !hasReviewed) {
          actionableProposals.push(actionableProposal as ActionableUserProposal);
        } else if (isAuthor) {
          authoredProposals.push(actionableProposal);
        } else {
          assignedProposals.push(actionableProposal);
        }
      }
    }
  }

  return {
    actionable: actionableProposals.sort((a, b) => {
      const proposalADueDate = a.currentEvaluation?.dueDate?.getTime() || 0;
      const proposalBDueDate = b.currentEvaluation?.dueDate?.getTime() || 0;

      if (!proposalADueDate && !proposalBDueDate) {
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      }

      return proposalBDueDate - proposalADueDate;
    }),
    authored: authoredProposals.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    assigned: assignedProposals.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  };
}
