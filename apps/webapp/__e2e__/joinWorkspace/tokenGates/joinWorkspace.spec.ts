import { baseUrl } from '@packages/config/constants';
import { expect } from '@playwright/test';
import { login } from '__e2e__/utils/session';
import { generateAndMockTokenGateRequests } from '__e2e__/utils/tokenGates';
import { mockWeb3 } from '__e2e__/utils/web3';
import { v4 } from 'uuid';

import { test } from '../../testWithFixtures';
import { generateSpaceRole, generateUserAndSpace } from '../../utils/mocks';

test.skip('joinWorkspace - search for a workspace and join a token gated workspace after meeting conditions', async ({
  page,
  tokenGatePage
}) => {
  const { space, page: pageDoc, user: spaceUser } = await generateUserAndSpace({ spaceName: v4() });
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

  // go to a page to which we don't have access
  await page.goto(`${baseUrl}/join`);

  // wait for token gate page to open for the workspace
  await tokenGatePage.waitForJoinURL();
  await expect(tokenGatePage.joinWorkspaceTextField).toBeVisible();
  await tokenGatePage.joinWorkspaceTextField.fill(space.name);
  await tokenGatePage.page.locator(`[data-test=join-workspace-autocomplete-${space.domain}]`).click();

  await expect(tokenGatePage.tokenGateForm).toBeVisible();
  await expect(tokenGatePage.joinWorkspaceButton).toBeVisible();
  await tokenGatePage.joinWorkspaceButton.click();
  await page.goto(`${baseUrl}/${space.domain}/${pageDoc.path}`);
  await page.locator(`text=${pageDoc.title}`).first().waitFor({ state: 'visible' });
});
