import { test as base, expect } from '@playwright/test';
import { SpaceMembersSettings } from '__e2e__/po/settings/spaceMembersSettings.po';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';

import { generateSpaceRole, generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: SpaceMembersSettings;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new SpaceMembersSettings(page))
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

  await spaceSettings.getSpaceSettingsLocator(isAdminSpace.id).click();

  // Expand the tabs. We might not always get the admin space as first expanded, so we need to be smart enough to expand it if it's not already expanded
  const isAdminTabExpanded = await spaceSettings.isSpaceSettingsExpanded(isAdminSpace.id);

  if (!isAdminTabExpanded) {
    await spaceSettings.getSpaceSettingsLocator(isAdminSpace.id).click();
  }

  await spaceSettings.goToTab({
    section: 'members',
    spaceId: isAdminSpace.id
  });

  // Make sure admin user shows up and they can edit the admin level
  const memberRow = spaceSettings.getSpaceMemberRowLocator(user.id);
  await expect(memberRow).toBeVisible();
  const isEditable = await spaceSettings.hasEditableMemberLevel(user.id);
  expect(isEditable).toBe(true);

  // Make sure other user doesn't show up
  const invisibleMemberRow = spaceSettings.getSpaceMemberRowLocator(otherSpaceAdmin.id);
  await expect(invisibleMemberRow).not.toBeVisible();

  // Go to second space where current user will not be an admin
  const isMemberTabExpanded = await spaceSettings.isSpaceSettingsExpanded(isMemberSpace.id);

  if (!isMemberTabExpanded) {
    await spaceSettings.getSpaceSettingsLocator(isMemberSpace.id).click();
  }

  await spaceSettings.goToTab({
    section: 'members',
    spaceId: isMemberSpace.id
  });

  // Verify both members now show up, and user now only has read access

  const currentUserRow = spaceSettings.getSpaceMemberRowLocator(user.id);
  await expect(currentUserRow).toBeVisible();

  const isCurrentUserRowEditable = await spaceSettings.hasEditableMemberLevel(user.id);
  expect(isCurrentUserRowEditable).toBe(false);

  // Make sure other user shows up (we changed current space by selecting a different space, so this should cascade to useMembers)
  const otherSpaceAdminRow = spaceSettings.getSpaceMemberRowLocator(otherSpaceAdmin.id);
  await expect(otherSpaceAdminRow).toBeVisible();
});
