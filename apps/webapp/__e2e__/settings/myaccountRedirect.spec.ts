import { expect } from '@playwright/test';
import { v4 } from 'uuid';

import { SettingsModal } from '../po/settings/settings.po';
import { test } from '../testWithFixtures';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

test('Space settings -  opens modal when coming from a notification email and the user clicked unsubscribe', async ({
  page,
  settingsModal
}) => {
  const { user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });

  await login({ page, userId: spaceUser.id });

  await settingsModal.goTo('?account=true');

  // wait for a bit while redirect happens
  await expect(settingsModal.getActivePath({ activePath: 'account' })).toBeVisible({ timeout: 20000 });
});
