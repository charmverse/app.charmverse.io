import { test as base, expect } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';
import { PermissionSettings } from '__e2e__/po/settings/spacePermissionSettings.po';
import { v4 } from 'uuid';

import { generateSpaceRole, generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: PermissionSettings;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new PermissionSettings(page))
});

// We have had a bug where the incorrect space was being used in the space settings page, which meant you'd always see the same members whatever the space
test('User has correct access in the space settings', async ({ page, spaceSettings }) => {
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

  await spaceSettings.clickRoleRowByTitle('Admin');

  // Make sure admin user shows up and they can edit the admin level
  const memberRow = spaceSettings.getSpaceMemberRowLocator(user.id);
  await expect(memberRow).toBeVisible();
  const isEditable = await spaceSettings.hasEditableMemberLevel(user.id);
  expect(isEditable).toBe(true);

  // Member info should be visible
  await spaceSettings.clickRoleRowByTitle('Default');
  const currentUserRow = spaceSettings.getSpaceMemberRowLocator(user.id);
  await expect(currentUserRow).toBeVisible();

  // Member row is editable
  const isCurrentUserRowEditable = await spaceSettings.hasEditableMemberLevel(user.id);
  expect(isCurrentUserRowEditable).toBe(true);
});
