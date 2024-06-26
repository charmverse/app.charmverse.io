import { prisma } from '@charmverse/core/prisma-client';

export async function deleteWorkflowTemplate({ spaceId, workflowId }: { spaceId: string; workflowId: string }) {
  return prisma.proposalWorkflow.delete({
    where: {
      id: workflowId,
      spaceId
    }
  });
}
