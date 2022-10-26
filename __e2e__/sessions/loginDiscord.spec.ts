import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import type { WorkerFixture } from '../fixtures/discordServer';
import { discordServer as discordServerFixture, getServerHost } from '../fixtures/discordServer';
import { LoginPage } from '../po/login.po';
import { generateUserAndSpace, createDiscordUser } from '../utils/mocks';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
};

const discordUserId = uuid();

const test = base.extend<Fixtures, WorkerFixture>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage)),
  discordServer: discordServerFixture(discordUserId)
});

test('login - allows user to login and see their workspace', async ({ discordServer, loginPage }) => {

  const { user, space, page } = await generateUserAndSpace();
  await createDiscordUser({ userId: user.id, discordUserId });

  await loginPage.goto();

  const discordApiUrl = getServerHost(discordServer);
  const discordWebsiteUrl = await loginPage.getDiscordUrl();
  await loginPage.gotoDiscordCallback({ discordApiUrl, discordWebsiteUrl });

  // should auto redirect to workspace
  await loginPage.waitForWorkspaceLoaded({ domain: space.domain, page });

});

test.only('login - allows user to login and see their workspace even when a wallet is connected (regression check)', async ({ discordServer, loginPage }) => {

  const { address, user, space, page } = await generateUserAndSpace();
  await createDiscordUser({ userId: user.id, discordUserId });

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

  const discordApiUrl = getServerHost(discordServer);
  const discordWebsiteUrl = await loginPage.getDiscordUrl();
  await loginPage.gotoDiscordCallback({ discordApiUrl, discordWebsiteUrl });

  // should auto redirect to workspace
  await loginPage.waitForWorkspaceLoaded({ domain: space.domain, page });

});
