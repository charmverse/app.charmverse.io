import { test as base, expect } from '@playwright/test';
import { GlobalPage } from '__e2e__/po/global.po';
import { v4 } from 'uuid';

import { SpaceProfileSettings } from '../po/settings/spaceProfileSettings.po';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: SpaceProfileSettings;
  globalPage: GlobalPage;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new SpaceProfileSettings(page)),
  globalPage: ({ page }, use) => use(new GlobalPage(page))
});

test('Space settings - toggle feature visibility', async ({ page, spaceSettings, globalPage }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  // go to a page to which we don't have access

  await login({ page, userId: spaceUser.id });

  await spaceSettings.goTo(space.domain);

  await spaceSettings.waitForSpaceSettingsURL();

  // Make sure link is visible by default
  await expect(globalPage.sidebarProposalsLink).toBeVisible();

  await spaceSettings.openSettingsModal();
  await expect(spaceSettings.proposalsVisibilityToggle).toBeVisible();
  let classes = (await spaceSettings.proposalsVisibilityToggle.getAttribute('class')) ?? '';

  expect(!!classes?.match('Mui-checked')).toBe(true);
  await spaceSettings.proposalsVisibilityToggle.click();

  classes = (await spaceSettings.proposalsVisibilityToggle.getAttribute('class')) ?? '';

  expect(!!classes?.match('Mui-checked')).toBe(false);

  // Give some time for API response
  await page.waitForTimeout(500);

  await expect(globalPage.sidebarProposalsLink).not.toBeVisible();

  await spaceSettings.closeModalButton.click();

  // Make sure modal is closed before evaluating the sidebar
  await expect(spaceSettings.closeModalButton).not.toBeVisible();
  await expect(globalPage.sidebarProposalsLink).not.toBeVisible();
});
