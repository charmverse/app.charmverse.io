import type { Page } from '@playwright/test';
import { expect, test as base } from '@playwright/test';

import { LoginPage } from '../po/login.po';
import { NexusPage } from '../po/nexus.po';
import { generateUserAndSpace } from '../utils/mocks';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
  nexusPage: NexusPage;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage)),
  nexusPage: ({ sandboxPage }, use) => use(new NexusPage(sandboxPage))
});

test('login - allows user to logout even with a connected wallet', async ({ loginPage, nexusPage }) => {

  const { address, privateKey } = await generateUserAndSpace();

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

  await nexusPage.goto();

  await nexusPage.waitForURL();

  await nexusPage.logoutButton.click();

  // should auto redirect to workspace
  await loginPage.waitForURL();

});
