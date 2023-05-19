import type { PagePermissionFlags, PagePolicyInput } from '@charmverse/core';
import { hasAccessToSpace } from '@charmverse/core';

export async function policyOnlyEditableByBountyCreator({
  flags,
  resource,
  userId
}: PagePolicyInput): Promise<PagePermissionFlags> {
  if (!resource.bounty) {
    return flags;
  }

  const { spaceRole } = await hasAccessToSpace({
    spaceId: resource.bounty.spaceId,
    userId
  });

  const canEdit = !!spaceRole?.isAdmin || resource.bounty.createdBy === userId;

  return {
    ...flags,
    edit_content: !canEdit ? false : flags.edit_content,
    delete: !canEdit ? false : flags.delete
  };
}
