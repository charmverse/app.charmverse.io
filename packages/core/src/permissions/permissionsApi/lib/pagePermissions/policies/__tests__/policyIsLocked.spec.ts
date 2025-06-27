import { AvailablePagePermissions } from '@packages/core/permissions';

import { policyIsLocked } from '../policyIsLocked';

describe('policyIsLocked', () => {
  const emptyPermissionFlags = new AvailablePagePermissions({ isReadonlySpace: false }).empty;

  it('should remove editing permissions from the user', async () => {
    const permissionsAfterPolicy = policyIsLocked({
      resource: { isLocked: true },
      flags: new AvailablePagePermissions({ isReadonlySpace: false }).full
    });

    expect(permissionsAfterPolicy).toEqual({
      ...emptyPermissionFlags,
      read: true,
      comment: true,
      edit_position: true,
      grant_permissions: true,
      edit_lock: true
    });
  });
});
