import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import type { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';

import type { LoginPage } from '../po/login.po';
import type { SignUpPage } from '../po/signup.po';
import { generateUser, generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

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
  }
});

test('signup - not ignore the logic to redirect user after connect if the user has 0 spaces, and the redirect is to a join page', async ({
  sandboxPage
}) => {
  const { space } = await generateUserAndSpace({ isAdmin: true, spaceName: `space-${v4()}` });

  // mimic signup: create a user and a session
  const user = await generateUser();
  await sandboxPage.goto('/');
  await login({ page: sandboxPage, userId: user.id });
  await sandboxPage.goto(`${baseUrl}?returnUrl=${encodeURIComponent(`/join?domain=${space.domain}`)}`);

  await sandboxPage.waitForURL(`**/join?domain=${space.domain}`);
});
