import type { ProposalEvaluationType, ProposalWorkflowTemplate } from '@charmverse/core/prisma';

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
