import { expect, test as base } from '@playwright/test';
import { v4 } from 'uuid';

import { SettingsModal } from '../po/settings/settings.po';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: SettingsModal;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new SettingsModal(page))
});

test('Space settings - opens modal when coming from a notification email', async ({ page, spaceSettings }) => {
  const { user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });

  await login({ page, userId: spaceUser.id });

  await spaceSettings.goTo('/nexus?task=proposal');

  // wait for a bit while redirect happens
  await expect(spaceSettings.getActivePath({ activePath: 'notifications' })).toBeVisible({ timeout: 20000 });
});
