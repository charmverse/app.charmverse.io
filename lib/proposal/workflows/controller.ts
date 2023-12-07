import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

export async function getWorkflowTemplates(spaceId: string) {
  const dbWorkflows = await prisma.proposalWorkflow.findMany({
    where: {
      spaceId
    }
  });
  return dbWorkflows as ProposalWorkflowTyped[];
}

export async function deleteWorkflowTemplate({ spaceId, workflowId }: { spaceId: string; workflowId: string }) {
  return prisma.proposalWorkflow.delete({
    where: {
      id: workflowId,
      spaceId
    }
  });
}

export async function updateWorkflowTemplate(workflow: ProposalWorkflowTyped) {
  return prisma.proposalWorkflow.upsert({
    where: {
      id: workflow.id,
      spaceId: workflow.spaceId
    },
    create: workflow,
    update: workflow
  });
}
