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

test('Space settings -  opens modal when coming from a notification email and the user clicked unsubscribe', async ({
  page,
  spaceSettings
}) => {
  const { user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });

  await login({ page, userId: spaceUser.id });

  await spaceSettings.goTo('?account=true');

  // wait for a bit while redirect happens
  await expect(spaceSettings.getActivePath({ activePath: 'account' })).toBeVisible({ timeout: 20000 });
});
