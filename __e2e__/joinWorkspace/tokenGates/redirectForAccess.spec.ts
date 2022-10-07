import { test as base, expect } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { login } from '__e2e__/utils/session';

import { baseUrl } from 'config/constants';

import { generateUser, generateUserAndSpace } from '../../utils/mocks';

type Fixtures = {
  tokenGatePage: TokenGatePage;
};

const test = base.extend<Fixtures>({
  tokenGatePage: ({ page }, use) => use(new TokenGatePage(page))
});

test('tokenGates - redirect user to join page if they don\'t have access to workspace', async ({ page, tokenGatePage }) => {
  const { space } = await generateUserAndSpace();

  const user = await generateUser();

  await login({ userId: user.id, page });

  await page.goto(`${baseUrl}/${space.domain}`);

  await tokenGatePage.waitForURL();

  const isEmptyStateVisible = await tokenGatePage.isEmptyStateVisible();
  expect(isEmptyStateVisible).toBe(true);
});
