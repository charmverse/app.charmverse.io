import type { PagePermissionFlags } from '@packages/core/permissions';
import { AvailablePagePermissions } from '@packages/core/permissions';

import type { PagePolicyInput } from './interfaces';

export function policyConvertedToProposal({ flags, resource, isAdmin }: PagePolicyInput): PagePermissionFlags {
  if (!resource.convertedProposalId || isAdmin) {
    return flags;
  }

  const emptyPermissions = new AvailablePagePermissions({ isReadonlySpace: false }).empty;

  // Only provide the read permission if it exists
  return {
    ...emptyPermissions,
    read: flags.read === true
  };
}
