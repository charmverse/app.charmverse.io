import type { ProposalWorkflowTemplate } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

type SpaceEvaluationPermission = {
  level: 'view' | 'comment' | 'edit' | 'move';
  resourceType: 'space' | 'user' | 'role';
  id: string;
};

type EvaluationTemplate = {
  title: string;
  permissions: SpaceEvaluationPermission[];
};

export type WorkflowTemplate = Omit<ProposalWorkflowTemplate, 'evaluations'> & {
  evaluations: EvaluationTemplate[];
};

export const getDefaultWorkflows: (spaceId: string) => WorkflowTemplate[] = (spaceId) => [
  {
    id: uuid(),
    title: 'Community Proposals',
    evaluations: [],
    index: 0,
    spaceId
  },
  {
    id: uuid(),
    title: 'Decision Matrix',
    evaluations: [],
    index: 1,
    spaceId
  },
  {
    id: uuid(),
    title: 'Grant Applications',
    evaluations: [],
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
