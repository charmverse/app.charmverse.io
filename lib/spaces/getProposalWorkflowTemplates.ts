import type { ProposalWorkflowTemplate } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

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

export async function getWorkflowTemplates(spaceId: string) {
  const dbWorkflows = await prisma.proposalWorkflowTemplate.findMany({
    where: {
      spaceId
    }
  });
  return dbWorkflows as WorkflowTemplate[];
}
