import { ProposalOperation } from '@charmverse/core/prisma-client';

import { typedKeys } from '../../utilities/objects';
import type { UserPermissionFlags } from '../core/interfaces';

export const proposalOperations = typedKeys(ProposalOperation);

export type ProposalPermissionFlags = UserPermissionFlags<ProposalOperation>;

export type SmallProposalPermissionFlags = Pick<
  ProposalPermissionFlags,
  'view' | 'view_notes' | 'view_private_fields' | 'evaluate'
>;
