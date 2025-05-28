import { prisma } from '@charmverse/core/prisma-client';

export async function unarchiveWorkflowTemplate({ spaceId, workflowId }: { spaceId: string; workflowId: string }) {
  return prisma.proposalWorkflow.update({
    where: {
      id: workflowId,
      spaceId
    },
    data: {
      archived: false
    }
  });
}
