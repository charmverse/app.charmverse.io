import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

import { LoginPage } from '../po/login.po';
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
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage))
});

test('login - redirects a logged in user on the site to their workspace', async ({ loginPage }) => {
  const { space, address, privateKey, pages } = await createUserAndSpace({
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

  // Prepare pages as a glob OR pattern since we might land on any of them
  const rootPagePaths = pages.filter((page) => !page.parentId).map((page) => page.path);

  function matchPath(url: URL) {
    const pathName = url.pathname;

    for (const pagePath of rootPagePaths) {
      if (pathName.match(`${space.domain}/${pagePath}`)) {
        return true;
      }
    }

    return false;
  }

  // should auto redirect to workspace
  await loginPage.page.waitForURL(matchPath);
});
