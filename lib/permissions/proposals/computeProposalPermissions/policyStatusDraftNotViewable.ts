import type { ProposalOperation } from '@prisma/client';

import { isProposalAuthor } from 'lib/proposal/isProposalAuthor';
import { isProposalReviewer } from 'lib/proposal/isProposalReviewer';
import { typedKeys } from 'lib/utilities/objects';

import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPolicyInput } from './interfaces';

export async function policyStatusDraftNotViewable({
  resource,
  flags,
  userId,
  isAdmin
}: ProposalPolicyInput): Promise<AvailableProposalPermissionFlags> {
  const newPermissions = { ...flags };

  if (resource.status !== 'draft') {
    return newPermissions;
  }

  const allowedAuthorOperations: ProposalOperation[] = ['view', 'edit', 'delete', 'comment'];
  const allowedAdminOperations: ProposalOperation[] = ['view', 'delete', 'comment'];

  if (isProposalAuthor({ proposal: resource, userId })) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedAuthorOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  } else if (isAdmin) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedAdminOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  }

  const isReviewer = await isProposalReviewer({ proposal: resource, userId });

  if (isReviewer) {
    // At most allow a non author to view the proposal
    return { ...new AvailableProposalPermissions().empty, view: newPermissions.view === true };
  }

  return new AvailableProposalPermissions().empty;
}
