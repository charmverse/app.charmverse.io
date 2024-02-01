import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

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
      await tx.proposalEvaluation.create({
        data: {
          proposalId,
          index,
          title: evaluation.title,
          type: evaluation.type,
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
