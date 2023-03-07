import type { ProposalOperation } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPolicyInput } from './interfaces';

export async function policyStatusVoteClosedViewOnly({
  resource,
  flags
}: ProposalPolicyInput): Promise<AvailableProposalPermissionFlags> {
  const newPermissions = { ...flags };

  if (resource.status !== 'vote_closed') {
    return newPermissions;
  }

  const allowedOperations: ProposalOperation[] = ['view'];

  typedKeys(flags).forEach((flag) => {
    if (!allowedOperations.includes(flag)) {
      newPermissions[flag] = false;
    }
  });
  return newPermissions;
}
