import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

import { LoginPage } from '../po/login.po';
import { generateUserAndSpace } from '../utils/mocks';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage))
});

test('login - allows user to login and see their workspace', async ({ loginPage }) => {

  const { space, address, page, privateKey } = await generateUserAndSpace();

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

  // should auto redirect to workspace
  await loginPage.waitForWorkspaceLoaded({ domain: space.domain, page });

});
