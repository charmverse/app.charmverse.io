import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

import { createDiscordUser } from 'testing/utils/discord';

import type { DiscordServerDetails } from '../fixtures/discordServer';
import { discordServer as discordServerFixture } from '../fixtures/discordServer';
import { LoginPage } from '../po/login.po';
import { generateUserAndSpace } from '../utils/mocks';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
  discordServer: DiscordServerDetails;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage)),
  discordServer: discordServerFixture
});

test('login - allows user to login and see their workspace', async ({ discordServer, loginPage }) => {
  const discordUserId = discordServer.discordUserId;
  const { user, space, page } = await generateUserAndSpace();
  await createDiscordUser({ userId: user.id, discordUserId });
  await loginPage.waitForLogin(discordServer.host);

  await loginPage.goto();
  await loginPage.universalConnectButton.click();
  await loginPage.connectDiscordButton.click();
  await loginPage.waitForWorkspaceLoaded({ domain: space.domain, page });
});

test('login - allows user to login and see their workspace even when a wallet is connected (regression check)', async ({
  discordServer,
  loginPage
}) => {
  const discordUserId = discordServer.discordUserId;
  const { address, user, space, page } = await generateUserAndSpace();
  await createDiscordUser({ userId: user.id, discordUserId });
  await loginPage.waitForLogin(discordServer.host);
  await mockWeb3({
    page: loginPage.page,
    context: { address, privateKey: false },
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
  await loginPage.universalConnectButton.click();
  await loginPage.connectDiscordButton.click();
  await loginPage.waitForWorkspaceLoaded({ domain: space.domain, page });
});
