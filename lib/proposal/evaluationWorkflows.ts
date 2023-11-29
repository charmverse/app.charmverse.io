import type { ProposalEvaluationType, ProposalWorkflowTemplate } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

export const permissionLevels = ['view', 'comment', 'edit', 'move'];
export type PermissionLevel = (typeof permissionLevels)[number];
export const resourceTypes = ['space', 'user', 'role'];
export type ResourceType = (typeof permissionLevels)[number];

export type SpaceEvaluationPermission = {
  level: PermissionLevel;
  resourceType: ResourceType;
  id: string;
};

export type EvaluationTemplate = {
  id: string;
  title: string;
  type: ProposalEvaluationType;
  permissions: SpaceEvaluationPermission[];
};

export type WorkflowTemplate = Omit<ProposalWorkflowTemplate, 'evaluations'> & {
  evaluations: EvaluationTemplate[];
};

export const getDefaultWorkflows: (spaceId: string) => WorkflowTemplate[] = (spaceId) => [
  {
    id: uuid(),
    title: 'Community Proposals',
    evaluations: [
      {
        id: uuid(),
        title: 'Review',
        type: 'pass_fail',
        permissions: []
      },
      {
        id: uuid(),
        title: 'Community vote',
        type: 'vote',
        permissions: []
      }
    ],
    index: 0,
    spaceId
  },
  {
    id: uuid(),
    title: 'Decision Matrix',
    evaluations: [
      {
        id: uuid(),
        title: 'Review',
        type: 'pass_fail',
        permissions: []
      },
      {
        id: uuid(),
        title: 'Rubric evaluation',
        type: 'rubric',
        permissions: []
      }
    ],
    index: 1,
    spaceId
  },
  {
    id: uuid(),
    title: 'Grant Applications',
    evaluations: [
      {
        id: uuid(),
        title: 'Rubric evaluation',
        type: 'rubric',
        permissions: []
      }
    ],
    index: 2,
    spaceId
  }
];

export async function getWorkflowTemplates(spaceId: string) {
  return getDefaultWorkflows(spaceId);
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
