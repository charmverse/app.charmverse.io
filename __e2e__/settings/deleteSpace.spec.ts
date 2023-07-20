import { test as base } from '@playwright/test';
import { v4 } from 'uuid';

import { generateSpaceForUser } from 'testing/utils/spaces';

import { SpaceProfileSettings } from '../po/settings/spaceProfileSettings.po';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: SpaceProfileSettings;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new SpaceProfileSettings(page))
});

test('Space settings - delete space', async ({ page, spaceSettings }) => {
  const { space, user } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  const spaceToDelete = await generateSpaceForUser({ user });
  // go to a page to which we don't have access

  await login({ page, userId: user.id });

  await spaceSettings.goTo(spaceToDelete.domain);

  await spaceSettings.waitForSpaceSettingsURL();

  await spaceSettings.openSettingsModal();

  await spaceSettings.deleteSpaceButton.click();
  await spaceSettings.confirmDeleteSpaceButton.click();

  await spaceSettings.waitForSpaceSettingsURL(space.domain);
});
