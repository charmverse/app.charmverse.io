import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

import type { DiscordServerDetails } from '../fixtures/discordServer';
import { discordServer as discordServerFixture } from '../fixtures/discordServer';
import { LoginPage } from '../po/login.po';
import { SignUpPage } from '../po/signup.po';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
  signupPage: SignUpPage;
  discordServer: DiscordServerDetails;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser, discordServer }, use) => {
    const sandbox = await _browser.newContext();
    await sandbox.route(
      `**/api/discord/oauth?${encodeURI('type=login&authFlowType=popup&redirect=/')}`,
      async (route) => {
        await route.fulfill({
          status: 301,
          headers: {
            location: `${discordServer.host}/api/oauth2/authorize?prompt=consent&client_id=1234&response_type=code`
          }
        });
      }
    );
    await sandbox.route('**/api/discord/login', async (route) => {
      const _body = route.request().postData();
      await route.continue({
        postData: JSON.stringify({
          ...(_body ? JSON.parse(_body) : undefined),
          discordApiUrl: discordServer.host
        })
      });
    });
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage)),
  signupPage: ({ sandboxPage }, use) => use(new SignUpPage(sandboxPage)),
  discordServer: discordServerFixture
});

test('signup - allows user to sign up and create a workspace using Discord', async ({
  loginPage,
  discordServer,
  signupPage
}) => {
  await loginPage.goto();
  await loginPage.universalConnectButton.click();
  await loginPage.connectDiscordButton.click();
  await signupPage.waitForCreateSpacePage();
});
