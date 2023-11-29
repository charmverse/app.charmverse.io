import type { ProposalEvaluationType, ProposalWorkflowTemplate } from '@charmverse/core/prisma';
import { v4 as uuid } from 'uuid';

export const permissionLevels = ['view', 'comment', 'edit', 'move'] as const;
export type PermissionLevel = (typeof permissionLevels)[number];
export const resourceTypes = ['user', 'role', 'system_role'] as const;
export type ResourceType = (typeof resourceTypes)[number];

export type SystemRole = 'author' | 'reviewer' | 'space_member';

export type SpaceEvaluationPermission = {
  level: PermissionLevel;
  resourceType: ResourceType;
  id: string | SystemRole;
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
