import type { Page } from '@playwright/test';

import { LoginPage } from '../po/login.po';
import { SpacesDropdown } from '../po/spacesDropdown.po';
import { test as base } from '../testWithFixtures';
import { createUserAndSpace } from '../utils/mocks';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
  spacesDropdown: SpacesDropdown;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage)),
  spacesDropdown: ({ sandboxPage }, use) => use(new SpacesDropdown(sandboxPage))
});

test('login - allows user to logout even with a connected wallet', async ({ loginPage, spacesDropdown }) => {
  const { address, privateKey, space } = await createUserAndSpace({ browserPage: loginPage.page });

  await mockWeb3({
    page: loginPage.page,
    context: { privateKey, address },
    init: ({ Web3Mock, context }) => {
      Web3Mock.mock({
        blockchain: 'ethereum',
        accounts: {
          return: [context.address]
        }
      });
    }
  });

  await loginPage.goto();

  await loginPage.waitForWorkspaceLoaded({
    domain: space.domain,
    page: { path: 'getting-started', title: 'Getting started' }
  });

  await spacesDropdown.signOut();

  // should auto redirect to workspace
  await loginPage.waitForURL();
});
