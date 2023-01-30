import { test as base } from '@playwright/test';
import { v4 } from 'uuid';

import { SpaceSettingsPage } from './po/spaceSettings.po';
import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';

type Fixtures = {
  spaceSettingsPage: SpaceSettingsPage;
};

const test = base.extend<Fixtures>({
  spaceSettingsPage: ({ page }, use) => use(new SpaceSettingsPage(page))
});

test('Space settings - update the space name and domain', async ({ page, spaceSettingsPage }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  // go to a page to which we don't have access

  await login({ page, userId: spaceUser.id });

  await spaceSettingsPage.goTo(space.domain);

  await spaceSettingsPage.waitForSpaceSettingsURL();

  const newName = `New space name ${v4()}`;
  const newDomain = `new-space-domain-${v4()}`;

  await spaceSettingsPage.spaceNameField.fill(newName);
  await spaceSettingsPage.spaceDomainField.fill(newDomain);

  await spaceSettingsPage.submitSpaceUpdateButton.click();

  await spaceSettingsPage.waitForSpaceSettingsURL(newDomain);
});
