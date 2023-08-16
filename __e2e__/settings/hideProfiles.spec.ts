import { expect, test as base } from '@playwright/test';
import { v4 } from 'uuid';

import { SpaceProfileSettings } from '../po/settings/spaceProfileSettings.po';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: SpaceProfileSettings;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new SpaceProfileSettings(page))
});

test('Space settings - toggle feature visibility', async ({ spaceSettings }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  // go to a page to which we don't have access

  await login({ page: spaceSettings.page, userId: spaceUser.id });

  await spaceSettings.goTo(space.domain);

  await spaceSettings.waitForSpaceSettingsURL(space.domain);
  await spaceSettings.openSettingsModal();

  // Make sure Charmverse profile item is visible by default
  await expect(spaceSettings.profileCharmverseItem).toBeVisible();

  // By default all items are visible and the add button doesn't show.
  await expect(spaceSettings.profileOpenAddProfilesModal).not.toBeVisible();

  // Hide Charmverse profile item
  await spaceSettings.profileCharmverseItemMenu.click();
  await expect(spaceSettings.profileHideAction).toBeVisible();
  await spaceSettings.profileHideAction.click();
  await expect(spaceSettings.profileCharmverseItem).not.toBeVisible();

  // Save the profile settings
  await spaceSettings.submitSpaceUpdateButton.click();

  // Add again the charmverse profile item
  await expect(spaceSettings.profileOpenAddProfilesModal).toBeVisible();
  await spaceSettings.profileOpenAddProfilesModal.click();
  await expect(spaceSettings.profileAddProfilesModal).toBeVisible();
  await expect(spaceSettings.profileAddCharmverseProfileButton).toBeVisible();
  await spaceSettings.profileAddCharmverseProfileButton.click();
  await expect(spaceSettings.profileAddProfilesModal).not.toBeVisible();
  await expect(spaceSettings.profileCharmverseItem).toBeVisible();
});
