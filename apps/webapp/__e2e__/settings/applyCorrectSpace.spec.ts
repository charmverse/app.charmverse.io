import { baseUrl } from '@packages/config/constants';
import { expect } from '@playwright/test';
import { PermissionSettings } from '__e2e__/po/settings/spacePermissionSettings.po';
import { v4 } from 'uuid';

import { test } from '../testWithFixtures';
import { generateSpaceRole, generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';
// We have had a bug where the incorrect space was being used in the space settings page, which meant you'd always see the same members whatever the space
test('User has correct access in the space settings', async ({ page, spaceSettings, permissionSettings }) => {
  const { space: isMemberSpace, user: otherSpaceAdmin } = await generateUserAndSpace({
    spaceName: v4(),
    isAdmin: true,
    onboarded: true
  });
  const { user } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  // Make this user a member of the other space
  await generateSpaceRole({
    spaceId: isMemberSpace.id,
    userId: user.id,
    isAdmin: false
  });

  // Go to admin page

  await login({ page, userId: user.id });

  await page.goto(baseUrl as string);

  await spaceSettings.openSettingsModal();

  await spaceSettings.goToTab('roles');

  await permissionSettings.clickRoleRowByTitle('Admin');

  // Make sure admin user shows up and they can edit the admin level
  const memberRow = permissionSettings.getSpaceMemberRowLocator(user.id);
  await expect(memberRow).toBeVisible();
  const isEditable = await permissionSettings.hasEditableMemberLevel(user.id);
  expect(isEditable).toBe(true);

  // Member info should be visible
  await permissionSettings.clickRoleRowByTitle('Default');
  const currentUserRow = permissionSettings.getSpaceMemberRowLocator(user.id);
  await expect(currentUserRow).toBeVisible();

  // Member row is editable
  const isCurrentUserRowEditable = await permissionSettings.hasEditableMemberLevel(user.id);
  expect(isCurrentUserRowEditable).toBe(true);
});
