import { ProposalOperation } from '@charmverse/core/prisma-client';

import { typedKeys } from '../../utilities/objects';
import type { UserPermissionFlags } from '../core/interfaces';

export const proposalOperations = typedKeys(ProposalOperation);

export type ProposalPermissionFlags = UserPermissionFlags<ProposalOperation>;

/**
 * @users - a list of user ids that can be selected to review a proposal
 * @roles - a list of role ids that can be selected to review a proposal
 *
 */
export type ProposalReviewerPool = {
  userIds: string[];
  roleIds: string[];
};

export type SmallProposalPermissionFlags = Pick<
  ProposalPermissionFlags,
  'view' | 'view_notes' | 'view_private_fields' | 'evaluate'
>;
