import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';

import { baseUrl } from 'config/constants';

import { LoginPage } from '../po/login.po';
import { SignUpPage } from '../po/signup.po';
import { generateUser, generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
  signupPage: SignUpPage;
  tokenGatePage: TokenGatePage;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage)),
  signupPage: ({ sandboxPage }, use) => use(new SignUpPage(sandboxPage)),
  tokenGatePage: ({ sandboxPage }, use) => use(new TokenGatePage(sandboxPage))
});

test('signup - allows user to sign up and create a workspace using Metamask wallet', async ({ sandboxPage, loginPage, signupPage }) => {

  await mockWeb3({
    page: sandboxPage,
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

test('signup - ignores the logic to redirect user after connect', async ({ sandboxPage, signupPage }) => {

  // mimic signup: create a user and a session
  const user = await generateUser();
  await sandboxPage.goto('/');
  await login({ page: sandboxPage, userId: user.id });
  await sandboxPage.goto(`${baseUrl}?returnUrl=${encodeURIComponent('/profile')}`);

  await signupPage.waitForURL();

});

test('signup - follows the logic to redirect to a token gate', async ({ sandboxPage }) => {

  const user = await generateUser();

  // go to a workspace
  const { space } = await generateUserAndSpace();

  await login({ page: sandboxPage, userId: user.id });
  await sandboxPage.goto(`${baseUrl}?returnUrl=${encodeURIComponent(`/${space.domain}`)}`);

  await sandboxPage.waitForURL('**/join**');

});
