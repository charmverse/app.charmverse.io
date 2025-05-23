import { baseUrl } from '@packages/config/constants';
import { expect } from '@playwright/test';
import { login } from '__e2e__/utils/session';

import { generateUser, generateUserAndSpace } from '../../utils/mocks';
import { test } from '../testWithFixtures';

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
