import type { ProposalEvaluationType, ProposalWorkflowTemplate } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

type SpaceEvaluationPermission = {
  level: 'view' | 'comment' | 'edit' | 'move';
  resourceType: 'space' | 'user' | 'role';
  id: string;
};

export type EvaluationStep = {
  id: string;
  title: string;
  type: ProposalEvaluationType | 'pass_fail';
  permissions: SpaceEvaluationPermission[];
};

export type WorkflowTemplate = Omit<ProposalWorkflowTemplate, 'evaluations'> & {
  evaluations: EvaluationStep[];
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
