import type { ProposalCategoryPermissionLevel } from '@prisma/client';

export type BulkRoleProposalCategoryPermissionUpsert = {
  permissionLevel: ProposalCategoryPermissionLevel;
  roleIds: string[];
};

export const proposalCategoryPermissionLabels: Record<ProposalCategoryPermissionLevel, string> = {
  full_access: 'Full Access',
  view_comment_vote: 'Comment & vote',
  view_comment: 'Comment',
  view: 'View only'
} as const;
