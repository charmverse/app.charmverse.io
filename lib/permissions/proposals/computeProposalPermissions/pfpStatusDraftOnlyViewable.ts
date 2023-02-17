import type { ProposalOperation } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPfpInput } from './interfaces';
import { isProposalAuthor } from './isProposalAuthor';

export async function pfpStatusDraftOnlyViewable({
  resource,
  flags,
  userId,
  isAdmin
}: ProposalPfpInput): Promise<AvailableProposalPermissionFlags> {
  const newPermissions = { ...flags };

  if (resource.status !== 'draft') {
    return newPermissions;
  }

  const allowedAuthorOperations: ProposalOperation[] = ['view', 'edit', 'delete', 'comment'];

  if (isProposalAuthor({ proposal: resource, userId }) || isAdmin) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedAuthorOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  }

  // At most allow a non author to view the proposal
  return { ...new AvailableProposalPermissions().empty, view: newPermissions.view === true };
}
