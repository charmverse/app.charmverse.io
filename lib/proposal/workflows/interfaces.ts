import type { ProposalEvaluationType, ProposalEvaluationWorkflow } from '@charmverse/core/prisma';

export const permissionLevels = ['view', 'comment', 'edit', 'move'] as const;
export type PermissionLevel = (typeof permissionLevels)[number];
export const permissionGroups = ['user', 'role', 'system_role'] as const;
export type PermissionGroup = (typeof permissionGroups)[number];

//  Note: current_reviewer = the current reviewer of the active proposal evaluation
export enum SystemRole {
  author = 'author',
  current_reviewer = 'current_reviewer',
  all_reviewers = 'all_reviewers',
  space_member = 'space_member'
}

export type SpaceEvaluationPermission = {
  level: PermissionLevel;
  group: PermissionGroup;
  id: string | SystemRole;
};

export type EvaluationTemplate = {
  id: string;
  title: string;
  type: ProposalEvaluationType;
  permissions: SpaceEvaluationPermission[];
};

export type WorkflowTemplate = Omit<ProposalEvaluationWorkflow, 'evaluations'> & {
  evaluations: EvaluationTemplate[];
};
