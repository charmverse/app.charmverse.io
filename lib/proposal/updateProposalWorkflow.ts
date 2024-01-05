import type { ProposalWorkflowTyped } from '@charmverse/core/dist/cjs/proposals';
import { prisma } from '@charmverse/core/prisma-client';

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
    await tx.proposalEvaluation.createMany({
      data: typedWorkflow.evaluations.map((evaluation, index) => ({
        proposalId,
        index,
        title: evaluation.title,
        type: evaluation.type,
        permissions: {
          create: evaluation.permissions
        }
      }))
    });
  });
}
