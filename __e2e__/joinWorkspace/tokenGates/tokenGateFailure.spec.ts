import { expect, test as base } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { login } from '__e2e__/utils/session';
import { generateAndMockTokenGateRequests } from '__e2e__/utils/tokenGates';
import { mockWeb3 } from '__e2e__/utils/web3';

import { baseUrl } from 'config/constants';

import { generateUserAndSpace } from '../../utils/mocks';

type Fixtures = {
  tokenGatePage: TokenGatePage;
};

const test = base.extend<Fixtures>({
  tokenGatePage: ({ page }, use) => use(new TokenGatePage(page))
});

test('tokenGates - token gate verify wallet shows error if no condition is met', async ({ page, tokenGatePage }) => {
  const { space, user: spaceUser } = await generateUserAndSpace();
  const { user, address, privateKey } = await generateUserAndSpace();

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

  await generateAndMockTokenGateRequests({
    address,
    space,
    page,
    userId: user.id,
    spaceUserId: spaceUser.id,
    canJoinSpace: false
  });

  const workspacePath = `/${space.domain}`;

  // go to a page to which we don't have access
  await page.goto(`${baseUrl}${workspacePath}`);
  await tokenGatePage.waitForWorkspaceURL({ domain: space.domain, returnUrl: workspacePath });
  await expect(tokenGatePage.tokenGateForm).toBeVisible();
  await tokenGatePage.verifyWalletButton.click();
  await expect(tokenGatePage.tokenGateFailureState).toBeVisible();
});
