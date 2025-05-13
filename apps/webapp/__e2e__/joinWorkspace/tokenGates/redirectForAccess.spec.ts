import { test as base, expect } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { login } from '__e2e__/utils/session';

import { generateUser, generateUserAndSpace } from '../../utils/mocks';

type Fixtures = {
  tokenGatePage: TokenGatePage;
};

const test = base.extend<Fixtures>({
  tokenGatePage: ({ page }, use) => use(new TokenGatePage(page))
});

test("tokenGates - redirect user to join page if they don't have access to workspace (shows alert if no token gate is found)", async ({
  page,
  tokenGatePage
}) => {
  const { space } = await generateUserAndSpace();

  const user = await generateUser();

  await login({ userId: user.id, page });

  const workspacePath = `/${space.domain}`;

  // go to a page to which we don't have access
  await page.goto(`${baseUrl}${workspacePath}`);

  // wait for token gate page to open for the workspace
  await tokenGatePage.waitForWorkspaceURL({ domain: space.domain });

  await expect(tokenGatePage.tokenGateEmptyState).toBeVisible();
});
