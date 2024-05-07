import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

import { getNewCriteria } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/Settings/components/RubricCriteriaSettings';

import { setPageUpdatedAt } from './setPageUpdatedAt';

export type UpdateWorkflowRequest = {
  proposalId: string;
  workflowId: string;
};

export async function updateProposalWorkflow({
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
      const existingStep = existingEvaluations.find((e) => e.title === evaluation.title);
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
      await tx.proposalEvaluation.create({
        data: {
          proposalId,
          index,
          title: evaluation.title,
          type: evaluation.type,
          reviewers: {
            createMany: {
              data: defaultReviewers
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
          }
        }
      });
    }
  });
  await setPageUpdatedAt({ proposalId, userId: actorId });
}
