import type { PagePermissionFlags } from '@packages/core/permissions';
import { AvailablePagePermissions } from '@packages/core/permissions';

import type { PagePolicyInput, PageResource } from './interfaces';

export function policyIsLocked({
  flags,
  resource
}: Omit<PagePolicyInput, 'resource'> & { resource: Pick<PageResource, 'isLocked'> }): PagePermissionFlags {
  if (!resource.isLocked) {
    return flags;
  }

  const emptyPermissions = new AvailablePagePermissions({ isReadonlySpace: false }).empty;
  return {
    ...emptyPermissions,
    read: flags.read === true,
    comment: flags.comment === true,
    edit_position: flags.edit_position === true,
    grant_permissions: flags.grant_permissions === true,
    edit_lock: flags.edit_lock === true
  };
} // Path: src/lib/pagePermissions/policies/resolver.ts
