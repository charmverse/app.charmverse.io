import type { ProposalOperation } from '@charmverse/core/prisma';

import { isProposalAuthor } from 'lib/proposal/isProposalAuthor';
import { typedKeys } from 'lib/utilities/objects';

import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPolicyInput } from './interfaces';

export async function policyStatusDiscussionEditableCommentable({
  resource,
  flags,
  userId,
  isAdmin
}: ProposalPolicyInput): Promise<AvailableProposalPermissionFlags> {
  const newPermissions = { ...flags };

  if (resource.status !== 'discussion') {
    return newPermissions;
  }

  const allowedAuthorOperations: ProposalOperation[] = ['view', 'edit', 'delete', 'comment', 'make_public'];

  if (isProposalAuthor({ proposal: resource, userId }) || isAdmin) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedAuthorOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  }

  // At most allow a non author to view and comment the proposal
  return {
    ...new AvailableProposalPermissions().empty,
    view: newPermissions.view === true,
    comment: newPermissions.comment === true
  };
}
