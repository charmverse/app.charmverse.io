import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config/constants';
import { expect } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { login } from '__e2e__/utils/session';
import { generateAndMockTokenGateRequests } from '__e2e__/utils/tokenGates';
import { mockWeb3 } from '__e2e__/utils/web3';

import { test } from '../../testWithFixtures';
import { generateUserAndSpace } from '../../utils/mocks';

test.skip('tokenGateSuccess - join workspace after meeting conditions in a token gated space', async ({
  page,
  tokenGatePage
}) => {
  const { space, page: pageDoc, user: spaceUser } = await generateUserAndSpace();
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
    spaceUserId: spaceUser.id
  });

  const workspacePath = `/${space.domain}`;

  // go to a page to which we don't have access
  await page.goto(`${baseUrl}${workspacePath}`);

  // wait for token gate page to open for the workspace
  await tokenGatePage.waitForWorkspaceURL({ domain: space.domain });
  await expect(tokenGatePage.tokenGateForm).toBeVisible();

  await expect(tokenGatePage.joinWorkspaceButton).toBeVisible();
  await tokenGatePage.joinWorkspaceButton.click();
  await page.goto(`${baseUrl}${workspacePath}`);
  await page.locator(`text=${pageDoc.title}`).first().waitFor({ state: 'visible' });
});
