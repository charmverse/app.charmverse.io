import { prisma } from '@charmverse/core/prisma-client';

export async function archiveWorkflowTemplate({ spaceId, workflowId }: { spaceId: string; workflowId: string }) {
  return prisma.proposalWorkflow.update({
    where: {
      id: workflowId,
      spaceId
    },
    data: {
      archived: true
    }
  });
}
