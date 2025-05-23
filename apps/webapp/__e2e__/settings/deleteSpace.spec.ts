import { generateSpaceForUser } from '@packages/testing/utils/spaces';
import { test as base } from '@playwright/test';
import { v4 } from 'uuid';

import { test } from '../testWithFixtures';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

test.describe('Space settings - delete space', () => {
  // test('When user has another space, redirect to next space', async ({ page, spaceSettings }) => {
  //   const { space, user } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  //   const spaceToDelete = await generateSpaceForUser({ user });

  //   await login({ page, userId: user.id });

  //   await spaceSettings.goTo(spaceToDelete.domain);

  //   await spaceSettings.waitForSpaceSettingsURL();

  //   await spaceSettings.openSettingsModal();

  //   await spaceSettings.deleteSpaceButton.click();
  //   await spaceSettings.confirmDeleteSpaceButton.click();

  //   await spaceSettings.waitForSpaceSettingsURL(space.domain);
  // });

  test('When user has no more spaces, redirect to /createSpace', async ({ page, spaceSettings }) => {
    const { space, user } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });

    await login({ page, userId: user.id });

    await spaceSettings.goTo(space.domain);

    await spaceSettings.waitForSpaceSettingsURL();

    await spaceSettings.openSettingsModal();

    await spaceSettings.deleteSpaceButton.click();
    await spaceSettings.confirmDeleteSpaceButton.click();

    await spaceSettings.page.waitForURL('**/createSpace');
  });
});
