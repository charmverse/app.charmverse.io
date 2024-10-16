import type {
  FormFieldType,
  Prisma,
  ProposalEvaluationResult,
  ProposalEvaluationType,
  ProposalStatus
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation, privateEvaluationSteps } from '@charmverse/core/proposals';

import { permissionsApiClient } from '../permissions/api/client';

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
  reviewedAt?: Date | null;
  customColumns?: {
    formFieldId: string;
    value: Prisma.JsonValue;
  }[];
  userReviewResult?: ProposalEvaluationResult | null;
  totalPassedReviewResults?: number;
  totalFailedReviewResults?: number;
};

export type CustomColumn = {
  formFieldId: string;
  title: string;
  type: FormFieldType;
  options: { id: string; name: string; color: string }[];
};

export type GetUserProposalsResponse = {
  actionable: UserProposal[];
  authored: UserProposal[];
  review_completed: UserProposal[];
  customColumns: CustomColumn[];
};

function sortProposalByCustomColumns(
  proposalA: UserProposal,
  proposalB: UserProposal,
  customColumns: CustomColumn[]
): number {
  if (!customColumns.length) {
    return 0;
  }

  const customColumnA = customColumns.find((column) => column.formFieldId === proposalA.customColumns?.[0].formFieldId);
  const customColumnB = customColumns.find((column) => column.formFieldId === proposalB.customColumns?.[0].formFieldId);

  let columnAValue = (proposalA.customColumns?.[0]?.value as string) || '';
  let columnBValue = (proposalB.customColumns?.[0]?.value as string) || '';

  if (customColumnA?.type === 'select' || customColumnA?.type === 'multiselect') {
    columnAValue = customColumnA.options.find((option) => option.id === proposalA.customColumns?.[0].value)?.name || '';
  }
  if (customColumnB?.type === 'select' || customColumnB?.type === 'multiselect') {
    columnBValue = customColumnB.options.find((option) => option.id === proposalB.customColumns?.[0].value)?.name || '';
  }

  return columnBValue.localeCompare(columnAValue);
}

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

  const proposalMyWorkColumns = await prisma.proposalMyWorkColumn.findMany({
    where: {
      spaceId
    },
    select: {
      formField: {
        select: {
          id: true,
          name: true,
          type: true,
          options: true,
          answers: {
            select: {
              proposalId: true,
              value: true
            }
          }
        }
      }
    }
  });

  const customColumnFormFieldRecord: Record<string, CustomColumn> = {};

  const proposalFormFieldRecord: Record<
    string,
    {
      formFieldId: string;
      value: Prisma.JsonValue;
    }[]
  > = {};

  for (const column of proposalMyWorkColumns) {
    const options = column.formField.options as CustomColumn['options'];
    customColumnFormFieldRecord[column.formField.id] = {
      formFieldId: column.formField.id,
      title: column.formField.name,
      type: column.formField.type,
      options: options ?? []
    };

    column.formField.answers.forEach((answer) => {
      proposalFormFieldRecord[answer.proposalId] = proposalFormFieldRecord[answer.proposalId] || [];
      proposalFormFieldRecord[answer.proposalId].push({
        formFieldId: column.formField.id,
        value: answer.value
      });
    });
  }

  const proposals = await prisma.proposal.findMany({
    where: {
      archived: {
        not: true
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
              reviewerId: true,
              completedAt: true
            }
          },
          reviews: {
            select: {
              reviewerId: true,
              completedAt: true,
              result: true
            }
          },
          vote: {
            select: {
              id: true,
              userVotes: {
                where: {
                  userId
                },
                select: {
                  userId: true,
                  updatedAt: true
                }
              }
            }
          },
          rubricAnswers: {
            select: {
              userId: true
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
  const reviewCompletedProposals: UserProposal[] = [];

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
            viewable: true,
            reviewedAt: null
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
        const userReviewResult = currentEvaluation?.reviews.find((review) => review.reviewerId === userId)?.result;
        const totalPassedReviewResults = currentEvaluation?.reviews.filter((review) => review.result === 'pass').length;
        const totalFailedReviewResults = currentEvaluation?.reviews.filter((review) => review.result === 'fail').length;

        const isVoter = currentEvaluation?.type === 'vote' && isReviewer;
        const isAppealReviewer = currentEvaluation?.appealReviewers.some(
          (reviewer) => reviewer.userId === userId || (reviewer.roleId && userRoles.includes(reviewer.roleId))
        );
        const isApprover = currentEvaluation?.evaluationApprovers.some(
          (approver) => approver.userId === userId || (approver.roleId && userRoles.includes(approver.roleId))
        );
        const existingReview = currentEvaluation?.reviews.find((review) => review.reviewerId === userId);
        const existingAppealReview = currentEvaluation?.appealReviews.find((review) => review.reviewerId === userId);
        const existingRubricAnswer = currentEvaluation?.rubricAnswers.find((answer) => answer.userId === userId);
        const existingVote = currentEvaluation?.vote?.userVotes.find((vote) => vote.userId === userId);

        const hasReviewed = existingReview || existingRubricAnswer;
        const hasReviewedAppeal = existingAppealReview;
        const hasVoted = existingVote;

        const reviewedAt = existingReview?.completedAt || existingAppealReview?.completedAt || existingVote?.updatedAt;

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
            ? isVoter && !hasVoted
            : (isReviewer && !hasReviewed && !isAppealActive) ||
              (isAppealReviewer && !hasReviewedAppeal && isAppealActive) ||
              (isApprover && reviewThresholdReached && !isAppealActive));

        const canSeeEvaluationDetails =
          !isPrivateEvaluation || (isPrivateEvaluation && isReviewerApproverOrAppealReviewer);

        const hasReviewedAStep = proposal.evaluations.some(
          (evaluation) =>
            evaluation.vote?.userVotes.some((vote) => vote.userId === userId) ||
            evaluation.reviews.some((review) => review.reviewerId === userId) ||
            evaluation.rubricAnswers.some((answer) => answer.userId === userId) ||
            evaluation.appealReviews.some((review) => review.reviewerId === userId)
        );

        const userProposal = {
          id: proposal.id,
          title: proposal.page.title,
          currentEvaluation: !canSeeEvaluationDetails
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
          viewable: accessibleProposalIds.includes(proposal.id),
          reviewedAt,
          userReviewResult,
          totalPassedReviewResults,
          totalFailedReviewResults
        };

        // needs review/vote
        if (isActionable) {
          actionableProposals.push(userProposal);
        } else if (isAuthor) {
          authoredProposals.push(userProposal);
        }
        // has reviewed current or previous step
        else if (hasReviewedAStep) {
          reviewCompletedProposals.push(userProposal);
        }
      }
    }
  }

  [...actionableProposals, ...authoredProposals, ...reviewCompletedProposals].forEach((proposal) => {
    proposal.customColumns = proposalFormFieldRecord[proposal.id];
  });

  const customColumns = Object.values(customColumnFormFieldRecord);

  return {
    customColumns,
    actionable: actionableProposals.sort((a, b) => {
      if (customColumns.length) {
        return sortProposalByCustomColumns(a, b, customColumns);
      }
      const proposalADueDate = a.currentEvaluation?.dueDate?.getTime() || 0;
      const proposalBDueDate = b.currentEvaluation?.dueDate?.getTime() || 0;

      if (!proposalADueDate && !proposalBDueDate) {
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      }

      return proposalBDueDate - proposalADueDate;
    }),
    authored: authoredProposals.sort((a, b) => {
      return customColumns.length
        ? sortProposalByCustomColumns(a, b, customColumns)
        : b.updatedAt.getTime() - a.updatedAt.getTime();
    }),
    review_completed: reviewCompletedProposals.sort((a, b) => {
      return customColumns.length
        ? sortProposalByCustomColumns(a, b, customColumns)
        : b.updatedAt.getTime() - a.updatedAt.getTime();
    })
  };
}
