import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

import type { WorkerFixture } from '../fixtures/discordServer';
import { discordServer as discordServerFixture, getServerHost } from '../fixtures/discordServer';
import { LoginPage } from '../po/login.po';
import { SignUpPage } from '../po/signup.po';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
  signupPage: SignUpPage;
};

const test = base.extend<Fixtures, WorkerFixture>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage)),
  signupPage: ({ sandboxPage }, use) => use(new SignUpPage(sandboxPage)),
  discordServer: discordServerFixture()
});

test('signup - allows user to sign up and create a workspace using Discord', async ({ loginPage, discordServer, signupPage }) => {

  await loginPage.goto();

  const discordApiUrl = getServerHost(discordServer);
  const discordWebsiteUrl = await loginPage.getDiscordUrl();
  await loginPage.gotoDiscordCallback({ discordApiUrl, discordWebsiteUrl });

  await signupPage.waitForURL();

});
