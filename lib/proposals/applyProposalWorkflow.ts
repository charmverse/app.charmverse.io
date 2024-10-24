import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

import { setPageUpdatedAt } from './setPageUpdatedAt';
import { getNewCriteria } from './workflows/getNewCriteria';

export type UpdateWorkflowRequest = {
  proposalId: string;
  workflowId: string;
};

export async function applyProposalWorkflow({
  actorId,
  proposalId,
  workflowId
}: UpdateWorkflowRequest & { actorId: string }) {
  const workflow = await prisma.proposalWorkflow.findUniqueOrThrow({
    where: {
      id: workflowId
    }
  });
  const existingEvaluations = await prisma.proposalEvaluation.findMany({
    where: {
      proposalId
    },
    include: {
      reviewers: true,
      appealReviewers: true,
      rubricCriteria: true
    }
  });
  const typedWorkflow = workflow as ProposalWorkflowTyped;

  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        workflowId
      }
    });
    await tx.proposalEvaluation.deleteMany({
      where: {
        proposalId
      }
    });
    // prisma does not support nested createMany
    for (let index = 0; index < typedWorkflow.evaluations.length; index++) {
      const evaluation = typedWorkflow.evaluations[index];
      // try to retain existing reviewers and configuration
      const existingStep = existingEvaluations.find((e) => e.title === evaluation.title && e.type === evaluation.type);

      const rubricCriteria =
        evaluation.type === 'rubric'
          ? (existingStep?.rubricCriteria.length &&
              existingStep?.rubricCriteria.map(({ evaluationId, ...criteria }) => ({
                ...criteria,
                parameters: criteria.parameters as any
              }))) || [{ proposalId, ...getNewCriteria() }]
          : [];

      // include author as default reviewer for feedback
      const defaultReviewers = evaluation.type === 'feedback' ? [{ proposalId, systemRole: 'author' as const }] : [];
      const reviewers = existingStep?.reviewers.map(({ evaluationId, ...reviewer }) => reviewer) || defaultReviewers;
      const appealReviewers = existingStep?.appealReviewers.map(({ evaluationId, ...reviewer }) => reviewer) || [];
      const requiredReviews = evaluation.requiredReviews;
      const appealRequiredReviews = evaluation.appealRequiredReviews;
      await tx.proposalEvaluation.create({
        data: {
          proposalId,
          index,
          title: evaluation.title,
          type: evaluation.type,
          voteSettings: (existingStep?.voteSettings as any) || undefined,
          reviewers: {
            createMany: {
              data: reviewers
            }
          },
          rubricCriteria: {
            createMany: {
              data: rubricCriteria
            }
          },
          permissions: {
            createMany: {
              data: evaluation.permissions
            }
          },
          requiredReviews: requiredReviews ?? 1,
          appealReviewers: {
            createMany: {
              data: appealReviewers
            }
          },
          appealable: evaluation.appealable,
          appealRequiredReviews,
          notificationLabels: evaluation.notificationLabels || undefined,
          actionLabels: evaluation.actionLabels || undefined,
          finalStep: evaluation.finalStep,
          showAuthorResultsOnRubricFail: evaluation.showAuthorResultsOnRubricFail
        }
      });
    }
  });
  await setPageUpdatedAt({ proposalId, userId: actorId });
}
