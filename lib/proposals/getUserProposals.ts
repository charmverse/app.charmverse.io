import type { ProposalEvaluationResult, ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation, privateEvaluationSteps } from '@charmverse/core/proposals';

import { permissionsApiClient } from '../permissions/api/client';

import { concealProposalSteps } from './concealProposalSteps';

type CurrentEvaluation = {
  id: string;
  type: ProposalEvaluationType;
  dueDate: Date | null;
  title: string;
  result: ProposalEvaluationResult | null;
};

export type UserProposal = {
  id: string;
  title: string;
  updatedAt: Date;
  path: string;
  status: ProposalStatus;
  currentEvaluation?: CurrentEvaluation;
  viewable: boolean;
};

export type GetUserProposalsResponse = {
  actionable: UserProposal[];
  authored: UserProposal[];
  assigned: UserProposal[];
};

export async function getUserProposals({
  spaceId,
  userId
}: {
  userId: string;
  spaceId: string;
}): Promise<GetUserProposalsResponse> {
  const spaceRole = await prisma.spaceRole.findFirstOrThrow({
    where: {
      spaceId,
      userId
    }
  });

  const accessibleProposalIds = await permissionsApiClient.proposals.getAccessibleProposalIds({
    userId,
    spaceId,
    onlyAssigned: true
  });

  const userRoles = await prisma.spaceRoleToRole
    .findMany({
      where: {
        role: {
          spaceId
        },
        spaceRoleId: spaceRole.id
      },
      select: {
        id: true,
        roleId: true
      }
    })
    .then((assignedRoles) => assignedRoles.map((role) => role.roleId));

  const proposals = await prisma.proposal.findMany({
    where: {
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
          ProposalAppealReviewer: {
            some: {
              userId
            }
          }
        },
        {
          ProposalAppealReviewer: {
            some: {
              roleId: {
                in: userRoles
              }
            }
          }
        },
        {
          proposalEvaluationApprovers: {
            some: {
              userId
            }
          }
        },
        {
          proposalEvaluationApprovers: {
            some: {
              roleId: {
                in: userRoles
              }
            }
          }
        },
        {
          reviewers: {
            some: {
              systemRole: 'space_member'
            }
          }
        },
        {
          reviewers: {
            some: {
              userId
            }
          }
        },
        {
          reviewers: {
            some: {
              roleId: {
                in: userRoles
              }
            }
          }
        }
      ],
      spaceId,
      page: {
        type: 'proposal',
        deletedAt: null
      }
    },
    select: {
      workflow: {
        select: {
          privateEvaluations: true
        }
      },
      id: true,
      workflowId: true,
      spaceId: true,
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
          requiredReviews: true,
          appealReviews: {
            select: {
              reviewerId: true
            }
          },
          reviews: {
            select: {
              reviewerId: true
            }
          },
          vote: {
            select: {
              id: true,
              userVotes: {
                select: {
                  userId: true
                }
              }
            }
          },
          appealReviewers: {
            select: {
              userId: true,
              roleId: true
            }
          },
          evaluationApprovers: {
            select: {
              userId: true,
              roleId: true
            }
          },
          reviewers: {
            select: {
              userId: true,
              roleId: true,
              systemRole: true,
              evaluationId: true
            }
          }
        }
      },
      page: {
        select: {
          title: true,
          updatedAt: true,
          path: true
        }
      }
    }
  });

  const actionableProposals: UserProposal[] = [];
  const authoredProposals: UserProposal[] = [];
  const assignedProposals: UserProposal[] = [];

  for (const proposal of proposals) {
    const isAuthor = proposal.authors.some((author) => author.userId === userId);
    if (proposal.page) {
      if (proposal.status === 'draft') {
        if (isAuthor) {
          authoredProposals.push({
            id: proposal.id,
            title: proposal.page.title,
            currentEvaluation: undefined,
            path: proposal.page.path,
            updatedAt: proposal.page.updatedAt,
            status: proposal.status,
            viewable: true
          });
        }
      } else {
        const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
        const isReviewer = currentEvaluation?.reviewers.some(
          (reviewer) =>
            reviewer.userId === userId ||
            (reviewer.roleId && userRoles.includes(reviewer.roleId)) ||
            reviewer.systemRole === 'space_member'
        );
        const canVote = currentEvaluation?.type === 'vote' && isReviewer;
        const isAppealReviewer = currentEvaluation?.appealReviewers.some(
          (reviewer) => reviewer.userId === userId || (reviewer.roleId && userRoles.includes(reviewer.roleId))
        );
        const isApprover = currentEvaluation?.evaluationApprovers.some(
          (approver) => approver.userId === userId || (approver.roleId && userRoles.includes(approver.roleId))
        );
        const hasReviewed = currentEvaluation?.reviews.some((review) => review.reviewerId === userId);
        const hasReviewedAppeal = currentEvaluation?.appealReviews.some((review) => review.reviewerId === userId);
        const hasVoted = currentEvaluation?.vote?.userVotes.some((vote) => vote.userId === userId);

        const isReviewerApproverOrAppealReviewer = isAppealReviewer || isReviewer || isApprover;

        const reviewThresholdReached =
          (currentEvaluation?.reviews.length ?? 0) >= (currentEvaluation?.requiredReviews ?? 1);

        const isAppealActive = !!currentEvaluation?.appealedAt;

        const isPrivateEvaluation =
          proposal.workflow?.privateEvaluations &&
          currentEvaluation &&
          privateEvaluationSteps.includes(currentEvaluation.type);

        const isActionable =
          !currentEvaluation?.result &&
          (currentEvaluation?.type === 'vote'
            ? canVote && !hasVoted
            : (isReviewer && !hasReviewed && !isAppealActive) ||
              (isAppealReviewer && !hasReviewedAppeal && isAppealActive) ||
              (isApprover && reviewThresholdReached && !isAppealActive));

        const canSeeEvaluationDetails =
          !isPrivateEvaluation || (isPrivateEvaluation && isReviewerApproverOrAppealReviewer);

        const userProposal = {
          id: proposal.id,
          title: proposal.page.title,
          currentEvaluation: canSeeEvaluationDetails
            ? undefined
            : currentEvaluation
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
          status: proposal.status,
          viewable: accessibleProposalIds.includes(proposal.id)
        };

        if (isActionable) {
          actionableProposals.push(userProposal);
        } else if (isAuthor) {
          authoredProposals.push(userProposal);
        } else {
          assignedProposals.push(userProposal);
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
