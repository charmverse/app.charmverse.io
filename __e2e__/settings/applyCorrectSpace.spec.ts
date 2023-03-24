import { test as base, expect } from '@playwright/test';
import { PermissionSettings } from '__e2e__/po/settings/spacePermissionSettings.po';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';

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
  const { space: isAdminSpace, user } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
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

  await spaceSettings.goToTab({
    section: 'roles',
    spaceId: isAdminSpace.id
  });

  await spaceSettings.clickRoleRowByTitle('Admin');

  // Make sure admin user shows up and they can edit the admin level
  const memberRow = spaceSettings.getSpaceMemberRowLocator(user.id);
  await expect(memberRow).toBeVisible();
  const isEditable = await spaceSettings.hasEditableMemberLevel(user.id);
  expect(isEditable).toBe(true);

  // Make sure other user doesn't show up
  const invisibleMemberRow = spaceSettings.getSpaceMemberRowLocator(otherSpaceAdmin.id);
  await expect(invisibleMemberRow).not.toBeVisible();

  // Go to second space where current user will not be an admin
  await spaceSettings.getSpaceSettingsLocator(isMemberSpace.id).click();

  await spaceSettings.goToTab({
    section: 'roles',
    spaceId: isMemberSpace.id
  });
  await spaceSettings.clickRoleRowByTitle('Member');

  // Verify both members now show up, and user now only has read access

  const currentUserRow = spaceSettings.getSpaceMemberRowLocator(user.id);
  await expect(currentUserRow).toBeVisible();

  const isCurrentUserRowEditable = await spaceSettings.hasEditableMemberLevel(user.id);
  expect(isCurrentUserRowEditable).toBe(false);

  // Make sure other user shows up (we changed current space by selecting a different space, so this should cascade to useMembers)
  await spaceSettings.clickRoleRowByTitle('Admin');
  const otherSpaceAdminRow = spaceSettings.getSpaceMemberRowLocator(otherSpaceAdmin.id);
  await expect(otherSpaceAdminRow).toBeVisible();
});
