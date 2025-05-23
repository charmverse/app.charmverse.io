import { baseUrl } from '@packages/config/constants';
import { generateTokenGate } from '@packages/testing/utils/tokenGates';
import type { Page } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { v4 } from 'uuid';

import { test as base, overrideCDNRequests } from '../testWithFixtures';
import { generateUser, generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  sandboxPage: Page;
  tokenGatePage: TokenGatePage;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await overrideCDNRequests(page);
    await use(page);
  },
  tokenGatePage: ({ sandboxPage }, use) => use(new TokenGatePage(sandboxPage))
});

test('signup - not ignore the logic to redirect user after connect if the user has 0 spaces, and the redirect is to a join page', async ({
  sandboxPage
}) => {
  const { space } = await generateUserAndSpace({ isAdmin: true, spaceName: `space-${v4()}` });

  // mimic signup: create a user and a session
  const user = await generateUser();
  await sandboxPage.goto('/');
  await login({ page: sandboxPage, userId: user.id });
  await sandboxPage.goto(`${baseUrl}?returnUrl=${encodeURIComponent(`/join?domain=${space.domain}`)}`);

  await sandboxPage.waitForURL(`**/join?domain=${space.domain}`);
});

test('join - user can login through a join page', async ({ tokenGatePage }) => {
  const { user: user1 } = await generateUserAndSpace();
  const { space: space2, user: user2 } = await generateUserAndSpace();
  await generateTokenGate({ spaceId: space2.id, userId: user2.id });

  await tokenGatePage.goToWorkspaceUrl({ domain: space2.domain });
  await tokenGatePage.waitForWorkspaceURL({ domain: space2.domain });
  await tokenGatePage.signInButton.click();

  await login({ userId: user1.id, page: tokenGatePage.page });

  await tokenGatePage.page.reload(); // when a user is logging in the page is reloaded
  await tokenGatePage.verifyButton.click();
});
