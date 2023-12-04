import { prisma } from '@charmverse/core/prisma-client';

import type { WorkflowTemplate } from './interfaces';

export async function getWorkflowTemplates(spaceId: string) {
  const dbWorkflows = await prisma.proposalEvaluationWorkflow.findMany({
    where: {
      spaceId
    }
  });
  return dbWorkflows as WorkflowTemplate[];
}

export async function deleteWorkflowTemplate({ spaceId, workflowId }: { spaceId: string; workflowId: string }) {
  return prisma.proposalEvaluationWorkflow.delete({
    where: {
      id: workflowId,
      spaceId
    }
  });
}

export async function updateWorkflowTemplate(workflow: WorkflowTemplate) {
  return prisma.proposalEvaluationWorkflow.upsert({
    where: {
      id: workflow.id,
      spaceId: workflow.spaceId
    },
    create: workflow,
    update: workflow
  });
}
