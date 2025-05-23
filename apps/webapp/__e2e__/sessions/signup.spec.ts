import { randomETHWalletAddress } from '@packages/utils/blockchain';
import type { Page } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';

import { LoginPage } from '../po/login.po';
import { SignUpPage } from '../po/signup.po';
import { test as base } from '../testWithFixtures';
import { createUser } from '../utils/mocks';
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

test('signup - allows user to sign up and create a workspace using Metamask wallet', async ({
  sandboxPage,
  loginPage,
  signupPage
}) => {
  const address = randomETHWalletAddress();

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

  await createUser({ browserPage: sandboxPage, address });

  await loginPage.goto();

  await signupPage.waitForCreateSpacePage();
  await signupPage.selectNewSpaceFormTemplate('default');
  const space = await signupPage.submitWorkspaceForm();

  await signupPage.waitForWorkspaceLoaded({ domain: space.domain });
});

// test('signup - ignores the logic to redirect user after connect if the user has 0 spaces', async ({
//   sandboxPage,
//   signupPage
// }) => {
//   // mimic signup: create a user and a session
//   const user = await generateUser();
//   await sandboxPage.goto('/');
//   await login({ page: sandboxPage, userId: user.id });
//   await sandboxPage.goto(`${baseUrl}?returnUrl=${encodeURIComponent('/profile')}`);

//   await signupPage.waitForURL();
// });

// test('signup - follows the logic to redirect to a token gate', async ({ sandboxPage }) => {
//   const user = await generateUser();

//   // go to a workspace
//   const { space } = await generateUserAndSpace();

//   await login({ page: sandboxPage, userId: user.id });
//   await sandboxPage.goto(`${baseUrl}?returnUrl=${encodeURIComponent(`/${space.domain}`)}`);

//   await sandboxPage.waitForURL('**/join**');
// });
