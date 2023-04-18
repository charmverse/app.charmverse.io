import type { ProposalCategoryPermissionLevel } from '@prisma/client';

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
