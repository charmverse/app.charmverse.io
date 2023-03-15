import type { ProposalOperation } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPolicyInput } from './interfaces';

export async function policyStatusVoteActiveOnlyVotable({
  resource,
  flags
}: ProposalPolicyInput): Promise<AvailableProposalPermissionFlags> {
  const newPermissions = { ...flags };

  if (resource.status !== 'vote_active') {
    return newPermissions;
  }

  const allowedOperations: ProposalOperation[] = ['view', 'vote'];

  typedKeys(flags).forEach((flag) => {
    if (!allowedOperations.includes(flag)) {
      newPermissions[flag] = false;
    }
  });
  return newPermissions;
}
