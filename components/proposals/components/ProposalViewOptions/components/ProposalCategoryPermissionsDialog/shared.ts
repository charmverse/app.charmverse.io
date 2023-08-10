import type { ProposalCategoryPermissionLevel } from '@charmverse/core/prisma';

export type BulkRoleProposalCategoryPermissionUpsert = {
  permissionLevel: ProposalCategoryPermissionLevel;
  roleIds: string[];
};

export const proposalCategoryPermissionLabels: Record<ProposalCategoryPermissionLevel, string> = {
  full_access: 'Create, Vote & Comment',
  create_comment: 'Create & Comment',
  view_comment_vote: 'Vote & Comment',
  view_comment: 'Comment',
  view: 'View only'
} as const;
