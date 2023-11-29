import { prisma } from '@charmverse/core/prisma-client';

import { getDefaultWorkflows } from './config';
import type { WorkflowTemplate } from './config';

export async function getWorkflowTemplates(spaceId: string) {
  const dbWorkflows = await prisma.proposalWorkflowTemplate.findMany({
    where: {
      spaceId
    }
  });
  return dbWorkflows as WorkflowTemplate[];
}

export async function deleteWorkflowTemplate({ spaceId, workflowId }: { spaceId: string; workflowId: string }) {
  return prisma.proposalWorkflowTemplate.delete({
    where: {
      id: workflowId,
      spaceId
    }
  });
}

export async function updateWorkflowTemplate(workflow: WorkflowTemplate) {
  return prisma.proposalWorkflowTemplate.upsert({
    where: {
      id: workflow.id,
      spaceId: workflow.spaceId
    },
    create: workflow,
    update: workflow
  });
}
