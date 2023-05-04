import type { ProposalOperation } from '@charmverse/core/dist/prisma';

import { isProposalAuthor } from 'lib/proposal/isProposalAuthor';
import { isProposalReviewer } from 'lib/proposal/isProposalReviewer';
import { typedKeys } from 'lib/utilities/objects';

import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../interfaces';

import type { ProposalPolicyInput } from './interfaces';

const allowedAuthorOperations: ProposalOperation[] = ['view', 'comment', 'delete', 'make_public'];
const allowedAdminOperations: ProposalOperation[] = [...allowedAuthorOperations, 'review', 'edit'];
const allowedReviewerOperations: ProposalOperation[] = ['view', 'comment', 'review'];

export async function policyStatusReviewCommentable({
  resource,
  flags,
  userId,
  isAdmin
}: ProposalPolicyInput): Promise<AvailableProposalPermissionFlags> {
  const newPermissions = { ...flags };

  if (resource.status !== 'review') {
    return newPermissions;
  }

  if (isAdmin) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedAdminOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  }

  const isAuthor = isProposalAuthor({ proposal: resource, userId });
  const isReviewer = await isProposalReviewer({ proposal: resource, userId });

  if (isAuthor && isReviewer) {
    typedKeys(flags).forEach((flag) => {
      if (![...allowedAuthorOperations, ...allowedReviewerOperations].includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  } else if (isAuthor) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedAuthorOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  } else if (isReviewer) {
    typedKeys(flags).forEach((flag) => {
      if (!allowedReviewerOperations.includes(flag)) {
        newPermissions[flag] = false;
      }
    });
    return newPermissions;
  }

  // At most allow a non author to view the proposal
  return {
    ...new AvailableProposalPermissions().empty,
    view: newPermissions.view === true
  };
}
