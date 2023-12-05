import type { ProposalOperation, ProposalEvaluationType, ProposalWorkflow } from '@charmverse/core/prisma';

export const proposalOperations: ProposalOperation[] = ['view', 'comment', 'edit', 'move'];

//  Note: current_reviewer = the current reviewer of the active proposal evaluation
export enum SystemRole {
  author = 'author',
  current_reviewer = 'current_reviewer',
  all_reviewers = 'all_reviewers',
  space_member = 'space_member'
}

export type SpaceEvaluationPermission = {
  level: ProposalOperation;
  group: PermissionGroup;
  id: string | SystemRole;
};

export type EvaluationTemplate = {
  id: string;
  title: string;
  type: ProposalEvaluationType;
  permissions: SpaceEvaluationPermission[];
};

export type WorkflowTemplate = Omit<ProposalWorkflow, 'evaluations'> & {
  evaluations: EvaluationTemplate[];
};
