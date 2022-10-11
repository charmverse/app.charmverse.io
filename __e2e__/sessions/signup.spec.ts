import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

import { LoginPage } from '../po/login.po';
import { SignUpPage } from '../po/signup.po';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
  signupPage: SignUpPage;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage)),
  signupPage: ({ sandboxPage }, use) => use(new SignUpPage(sandboxPage))
});

test('signup - allows user to sign up and create a workspace using Metamask wallet', async ({ loginPage, signupPage }) => {

  await mockWeb3({
    page: signupPage.page,
    init: ({ Web3Mock, context }) => {

      Web3Mock.mock({
        blockchain: 'ethereum',
        accounts: {
          return: [context.address]
        }
      });

    }
  });

  const uniqueDomain = Math.random().toString().replace('.', '');

  await loginPage.goto();

  await signupPage.waitForURL();
  await signupPage.selectCreateWorkspace();

  await signupPage.waitForWorkspaceForm();
  await signupPage.submitWorkspaceForm({ domain: uniqueDomain });

  await signupPage.waitForWorkspaceLoaded({ domain: uniqueDomain });

});
