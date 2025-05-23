import { STATIC_PAGES } from '@packages/features/constants';
import { expect } from '@playwright/test';
import { v4 } from 'uuid';

import { test } from '../testWithFixtures';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

test('Space settings - toggle feature visibility', async ({ spaceSettings }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  // go to a page to which we don't have access

  await login({ page: spaceSettings.page, userId: spaceUser.id });

  await spaceSettings.goTo(space.domain);

  await spaceSettings.waitForSpaceSettingsURL(space.domain);

  // Make sure static links are visible by default
  for (const { path } of STATIC_PAGES) {
    await expect(spaceSettings.getSidebarLink(path)).toBeVisible();
  }

  await spaceSettings.openSettingsModal();

  // Proposal should be visible by default
  await expect(spaceSettings.proposalsVisibility).toBeVisible();

  // Hide proposal item
  await spaceSettings.proposalsVisibilityMenu.click();
  await expect(spaceSettings.proposalsVisibilityHideAction).toBeVisible();
  await spaceSettings.proposalsVisibilityHideAction.click();
  await spaceSettings.submitSpaceUpdateButton.click();

  // Proposal item should now be off
  await spaceSettings.proposalsVisibilityMenu.click();
  await expect(spaceSettings.proposalsVisibilityShowAction).toBeVisible();
  await spaceSettings.page.keyboard.press('Escape');

  await spaceSettings.closeModalButton.click();

  // Make sure modal is closed before evaluating the sidebar
  await expect(spaceSettings.closeModalButton).not.toBeVisible();

  // Proposal link should be hidden
  await expect(spaceSettings.getSidebarLink('proposals')).not.toBeVisible();
});
