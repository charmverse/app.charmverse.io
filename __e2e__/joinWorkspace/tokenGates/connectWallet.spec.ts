import { test as base, expect } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { login } from '__e2e__/utils/session';

import { baseUrl } from 'config/constants';

import { generateDiscordUser, generateTokenGate, generateUserAndSpace } from '../../utils/mocks';

type Fixtures = {
  tokenGatePage: TokenGatePage;
};

const test = base.extend<Fixtures>({
  tokenGatePage: ({ page }, use) => use(new TokenGatePage(page))
});

test('connect wallet - show connect wallet button for token-gated workspaces and ', async ({ page, tokenGatePage }) => {
  const { space, user: spaceUser } = await generateUserAndSpace();

  const discordUser = await generateDiscordUser();

  await generateTokenGate({
    userId: spaceUser.id,
    spaceId: space.id
  });

  await login({ userId: discordUser.id, page });

  const workspacePath = `/${space.domain}`;

  await page.goto(`${baseUrl}${workspacePath}`);

  await tokenGatePage.waitForWorkspaceURL({ domain: space.domain, returnUrl: workspacePath });

  await expect(tokenGatePage.connectWalletButton).toBeVisible();
});
