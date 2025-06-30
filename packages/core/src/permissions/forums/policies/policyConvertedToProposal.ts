import { AvailablePostPermissions } from '../availablePostPermissions.class';
import type { PostPermissionFlags } from '../interfaces';

import type { PostPolicyInput } from './interfaces';

export async function policyConvertedToProposal({
  resource,
  flags,
  isAdmin,
  userId
}: PostPolicyInput): Promise<PostPermissionFlags> {
  if (!resource.proposalId || isAdmin) {
    return flags;
  }

  const emptyPermissions = new AvailablePostPermissions({ isReadonlySpace: false }).empty;

  if (userId === resource.createdBy) {
    return {
      ...emptyPermissions,
      view_post: flags.view_post === true,
      delete_post: flags.delete_post === true
    };
  }

  return {
    ...emptyPermissions,
    view_post: flags.view_post === true
  };
}
