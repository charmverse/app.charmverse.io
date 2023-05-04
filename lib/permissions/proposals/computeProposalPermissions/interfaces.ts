import type { PermissionFilteringPolicyFnInput, ProposalPermissionFlags } from '@charmverse/core';

import type { ProposalWithUsers } from 'lib/proposal/interface';

export type ProposalResource = Pick<
  ProposalWithUsers,
  'id' | 'spaceId' | 'status' | 'createdBy' | 'categoryId' | 'authors' | 'reviewers'
>;
export type ProposalPolicyInput = PermissionFilteringPolicyFnInput<ProposalResource, ProposalPermissionFlags>;
