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

  await spaceSettings.waitForSpaceSettingsURL();

  // Make sure link is visible by default
  await expect(spaceSettings.sidebarProposalsLink).toBeVisible();

  await spaceSettings.openSettingsModal();

  // Proposal visibility toggle should be on by default
  await expect(spaceSettings.proposalsVisibilityToggle).toBeVisible();
  let classes = (await spaceSettings.proposalsVisibilityToggle.getAttribute('class')) ?? '';

  expect(!!classes?.match('Mui-checked')).toBe(true);
  await spaceSettings.proposalsVisibilityToggle.click();
  await spaceSettings.page.waitForTimeout(500);

  await spaceSettings.page.waitForTimeout(200);

  // Proposal visibility toggle should now be off
  classes = (await spaceSettings.proposalsVisibilityToggle.getAttribute('class')) ?? '';

  expect(!!classes?.match('Mui-checked')).toBe(false);

  // Give some time for API response
  await spaceSettings.page.waitForTimeout(500);

  await expect(spaceSettings.sidebarProposalsLink).not.toBeVisible();

  await spaceSettings.closeModalButton.click();

  // Make sure modal is closed before evaluating the sidebar
  await expect(spaceSettings.closeModalButton).not.toBeVisible();
  await expect(spaceSettings.sidebarProposalsLink).not.toBeVisible();
});
