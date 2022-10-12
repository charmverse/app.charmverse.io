import { expect, test as base } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { login } from '__e2e__/utils/session';
import { mockWeb3 } from '__e2e__/utils/web3';

import { baseUrl } from 'config/constants';

import { generateTokenGate, generateUserAndSpace } from '../../utils/mocks';

type Fixtures = {
  tokenGatePage: TokenGatePage;
};

const test = base.extend<Fixtures>({
  tokenGatePage: ({ page }, use) => use(new TokenGatePage(page))
});

test('tokenGates - token gate verify wallet shows error if no condition is met', async ({ page, tokenGatePage }) => {
  const { space, user: spaceUser } = await generateUserAndSpace();
  const { user, address, privateKey } = await generateUserAndSpace();

  const tokenGate = await generateTokenGate({
    spaceId: space.id,
    userId: spaceUser.id
  });

  await mockWeb3({
    page: tokenGatePage.page,
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

  await login({ userId: user.id, page });

  const workspacePath = `/${space.domain}`;

  await page.route('**/api/token-gates', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([tokenGate])
    });
  });

  await page.route('**/api/token-gates/evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId: user.id,
        space,
        walletAddress: address,
        canJoinSpace: false, // This indicates that the user failed all of the token gate conditions
        gateTokens: [{ tokenGate, signedToken: '' }],
        roles: []
      })
    });
  });

  // go to a page to which we don't have access
  await page.goto(`${baseUrl}${workspacePath}`);
  await tokenGatePage.waitForWorkspaceURL({ domain: space.domain, returnUrl: workspacePath });
  await expect(tokenGatePage.tokenGateForm).toBeVisible();
  await tokenGatePage.verifyWalletButton.click();
  await expect(tokenGatePage.tokenGateFailureState).toBeVisible();
});
