import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

export type UpdateWorkflowRequest = {
  proposalId: string;
  workflowId: string;
};

export async function updateProposalWorkflow({ proposalId, workflowId }: UpdateWorkflowRequest) {
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
}
