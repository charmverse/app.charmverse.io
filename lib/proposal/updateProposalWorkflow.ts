import { prisma } from '@charmverse/core/prisma-client';

export type UpdateWorkflowRequest = {
  proposalId: string;
  workflowId: string;
};

export async function updateProposalWorkflow({ proposalId, workflowId }: UpdateWorkflowRequest) {
  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        workflowId
      }
    });
  });
}
