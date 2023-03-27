import type { ProposalOperation } from '@prisma/client';

import { isProposalAuthor } from 'lib/proposal/isProposalAuthor';
import { typedKeys } from 'lib/utilities/objects';

import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPolicyInput } from './interfaces';

export async function policyStatusVoteClosedViewOnly({
  resource,
  isAdmin,
  flags,
  userId
}: ProposalPolicyInput): Promise<AvailableProposalPermissionFlags> {
  const newPermissions = { ...flags };

  if (resource.status !== 'vote_closed') {
    return newPermissions;
  }

  const allowedOperations: ProposalOperation[] = ['view'];
  const allowedAuthorOperations: ProposalOperation[] = [...allowedOperations, 'make_public'];
  const allowedAdminOperations: ProposalOperation[] = [...allowedAuthorOperations, 'delete'];

  if (isAdmin) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedAdminOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
  } else if (isProposalAuthor({ userId, proposal: resource })) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedAuthorOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
  } else {
    typedKeys(flags).forEach((flag) => {
      if (!allowedOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
  }
  return newPermissions;
}
