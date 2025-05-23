import type { Page } from '@playwright/test';

import { LoginPage } from '../po/login.po';
import { test as base, overrideCDNRequests } from '../testWithFixtures';
import { createUserAndSpace } from '../utils/mocks';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await overrideCDNRequests(page);
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage))
});

test('login - redirects a logged in user on the site to their workspace', async ({ loginPage }) => {
  const { space, address, privateKey } = await createUserAndSpace({
    browserPage: loginPage.page,
    permissionConfigurationMode: 'collaborative'
  });

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
});
