import { AvailablePostPermissions } from '../availablePostPermissions.class';
import type { PostPermissionFlags } from '../interfaces';

import type { PostPolicyInput } from './interfaces';

export async function policyDraftPost({ resource, flags, userId }: PostPolicyInput): Promise<PostPermissionFlags> {
  if (!resource.isDraft) {
    return flags;
  }

  const newPermissions = {
    ...new AvailablePostPermissions({ isReadonlySpace: false }).empty,
    edit_post: resource.createdBy === userId,
    view_post: resource.createdBy === userId,
    delete_post: resource.createdBy === userId
  };

  return newPermissions;
}
