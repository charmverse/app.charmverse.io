import type { PermissionFilteringPolicyFnInput } from 'lib/permissions/buildComputePermissionsWithPermissionFilteringPolicies';
import type { ProposalWithUsers } from 'lib/proposal/interface';

import type { AvailableProposalPermissionFlags } from '../interfaces';

export type ProposalResource = Pick<
  ProposalWithUsers,
  'id' | 'spaceId' | 'status' | 'createdBy' | 'categoryId' | 'authors' | 'reviewers'
>;
export type ProposalPfpInput = PermissionFilteringPolicyFnInput<ProposalResource, AvailableProposalPermissionFlags>;
