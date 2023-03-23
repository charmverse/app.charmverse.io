import { expect, test as base } from '@playwright/test';
import { v4 } from 'uuid';

import { generateProposal } from 'testing/setupDatabase';

import { SettingsModal } from '../po/settings/settings.po';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: SettingsModal;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new SettingsModal(page))
});

test('Space settings -  opens modal when coming from a notification email and closes modal when navigating to another link', async ({
  page,
  spaceSettings
}) => {
  const { user: spaceUser, space } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });

  const prop = await generateProposal({
    proposalStatus: 'discussion',
    spaceId: space.id,
    authors: [spaceUser.id],
    reviewers: [],
    userId: spaceUser.id
  });

  await login({ page, userId: spaceUser.id });

  await spaceSettings.goTo('?task=proposal');

  // wait for a bit while redirect happens
  await expect(spaceSettings.getActivePath({ activePath: 'notifications' })).toBeVisible({ timeout: 20000 });

  await page.locator(`[data-test=goto-${prop.path}]`).first().click();

  await expect(spaceSettings.getActivePath({ activePath: 'notifications' })).not.toBeVisible({ timeout: 20000 });
});
