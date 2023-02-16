import type { ProposalCategoryOperation, ProposalCategoryPermissionLevel, ProposalOperation } from '@prisma/client';

import { proposalCategoryOperations, proposalOperations } from './interfaces';

export const proposalCategoryPermissionsMapping: Record<ProposalCategoryPermissionLevel, ProposalCategoryOperation[]> =
  {
    full_access: proposalCategoryOperations.slice(),
    view_comment_vote: [],
    view_comment: [],
    view: []
  };

export const proposalPermissionsMapping: Record<ProposalCategoryPermissionLevel, Readonly<ProposalOperation[]>> = {
  full_access: proposalOperations.slice(),
  view_comment: ['view', 'comment', 'vote'],
  view_comment_vote: [],
  view: []
} as const;

export const proposalCategoryPermissionLabels: Record<ProposalCategoryPermissionLevel, string> = {
  full_access: 'Full Access',
  view_comment_vote: 'View, comment & vote',
  view_comment: 'View & comment & vote',
  view: 'View'
} as const;
