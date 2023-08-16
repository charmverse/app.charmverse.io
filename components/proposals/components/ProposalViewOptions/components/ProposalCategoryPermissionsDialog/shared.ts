import type { ProposalCategoryPermissionLevel } from '@charmverse/core/prisma';

export type BulkRoleProposalCategoryPermissionUpsert = {
  permissionLevel: ProposalCategoryPermissionLevel;
  roleIds: string[];
};

export const proposalCategoryPermissionLabels: Record<ProposalCategoryPermissionLevel, string> = {
  full_access: 'Propose, Comment & Decide',
  create_comment: 'Propose & Comment',
  view_comment_vote: 'Vote & Comment',
  view_comment: 'Comment',
  view: 'View only'
} as const;
