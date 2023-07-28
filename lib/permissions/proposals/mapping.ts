import type {
  ProposalCategoryOperation,
  ProposalCategoryPermissionLevel,
  ProposalOperation
} from '@charmverse/core/prisma';

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
