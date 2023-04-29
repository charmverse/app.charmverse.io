import type { ProposalCategoryPermissionLevel } from '@charmverse/core/dist/prisma';

export type BulkRoleProposalCategoryPermissionUpsert = {
  permissionLevel: ProposalCategoryPermissionLevel;
  roleIds: string[];
};

export const proposalCategoryPermissionLabels: Record<ProposalCategoryPermissionLevel, string> = {
  full_access: 'Create, Vote & Comment',
  view_comment_vote: 'Vote & Comment',
  view_comment: 'Comment',
  view: 'View'
} as const;
