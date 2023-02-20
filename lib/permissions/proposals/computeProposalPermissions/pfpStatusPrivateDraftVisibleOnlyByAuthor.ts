import type { ProposalOperation } from '@prisma/client';

import { isProposalAuthor } from 'lib/proposal/isProposalAuthor';
import { typedKeys } from 'lib/utilities/objects';

import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPfpInput } from './interfaces';

export function pfpStatusPrivateDraftVisibleOnlyByAuthor({
  resource,
  flags,
  userId,
  isAdmin
}: ProposalPfpInput): AvailableProposalPermissionFlags {
  const newPermissions = { ...flags };

  if (resource.status !== 'private_draft') {
    return newPermissions;
  }

  const allowedOperations: ProposalOperation[] = ['view', 'edit', 'delete', 'comment'];
  if (isProposalAuthor({ proposal: resource, userId }) || isAdmin) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  }

  return new AvailableProposalPermissions().empty;
}
