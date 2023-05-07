import type { PermissionFilteringPolicyFnInput } from '@charmverse/core';

import type { ProposalWithUsers } from 'lib/proposal/interface';

import type { AvailableProposalPermissionFlags } from '../interfaces';

export type ProposalResource = Pick<
  ProposalWithUsers,
  'id' | 'spaceId' | 'status' | 'createdBy' | 'categoryId' | 'authors' | 'reviewers'
>;
export type ProposalPolicyInput = PermissionFilteringPolicyFnInput<ProposalResource, AvailableProposalPermissionFlags>;
