import { expect, test as base } from '@playwright/test';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';
import { generateProposal } from 'testing/setupDatabase';

import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

const test = base.extend({});
test('Space notifications -  opens modal when coming from a notification email and closes modal when navigating to another link', async ({
  page
}) => {
  const { user: spaceUser, space } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });

  const prop = await generateProposal({
    proposalStatus: 'discussion',
    spaceId: space.id,
    authors: [spaceUser.id],
    reviewers: [],
    userId: spaceUser.id
  });

  await login({ page, userId: spaceUser.id });

  await page.goto(`${baseUrl}/${space.domain}?notifications=proposal`);

  // wait for a bit while redirect happens
  await expect(page.locator(`[data-test-notification-tab=proposal]`)).toBeVisible({ timeout: 30000 });

  // click on notification
  await page.locator(`[data-test=goto-${prop.workspaceEvent.id}]`).click();
  await page.waitForURL(`**/${space.domain}/${prop.path}`);

  await expect(page.locator(`[data-test-notification-tab=proposal]`)).not.toBeVisible({ timeout: 30000 });
});
