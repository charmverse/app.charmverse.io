import type { ProposalCategoryOperation, ProposalCategoryPermissionLevel, ProposalOperation } from '@prisma/client';

import { proposalOperations } from './interfaces';

export const proposalCategoryPermissionsMapping: Record<ProposalCategoryPermissionLevel, ProposalCategoryOperation[]> =
  {
    full_access: ['create_proposal'],
    view_comment_vote: [],
    view_comment: [],
    view: []
  };

export const proposalPermissionsMapping: Record<ProposalCategoryPermissionLevel, Readonly<ProposalOperation[]>> = {
  full_access: ['view', 'comment', 'vote'],
  view_comment_vote: ['view', 'comment', 'vote'],
  view_comment: ['view', 'comment'],
  view: ['view']
} as const;

export const proposalCategoryPermissionLabels: Record<ProposalCategoryPermissionLevel, string> = {
  full_access: 'Full Access',
  view_comment_vote: 'Comment & vote',
  view_comment: 'Comment',
  view: 'View only'
} as const;
