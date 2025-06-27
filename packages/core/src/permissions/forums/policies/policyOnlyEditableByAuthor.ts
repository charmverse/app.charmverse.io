import type { PostPermissionFlags } from '../interfaces';

import type { PostPolicyInput } from './interfaces';

export async function policyOnlyEditableByAuthor({
  resource,
  flags,
  userId
}: PostPolicyInput): Promise<PostPermissionFlags> {
  const newPermissions = {
    ...flags,
    edit_post: resource.createdBy === userId
  };

  return newPermissions;
}
