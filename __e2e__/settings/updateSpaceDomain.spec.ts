import { test as base } from '@playwright/test';
import { v4 } from 'uuid';

import { SpaceSettings } from '../po/spaceSettings.po';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: SpaceSettings;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new SpaceSettings(page))
});

test('Space settings - save API settings', async ({ page, spaceSettings }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  // go to a page to which we don't have access

  await login({ page, userId: spaceUser.id });

  await spaceSettings.goTo(space.domain);

  await spaceSettings.waitForSpaceSettingsURL();

  await spaceSettings.openSettingsModal();

  const newName = `New space name ${v4()}`;
  const newDomain = `new-space-domain-${v4()}`;

  await spaceSettings.spaceNameInput.fill(newName);
  await spaceSettings.spaceDomainInput.fill(newDomain);

  await spaceSettings.submitSpaceUpdateButton.click();

  await spaceSettings.waitForSpaceSettingsURL(newDomain);
});
