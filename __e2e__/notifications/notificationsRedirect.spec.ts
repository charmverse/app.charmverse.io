import { expect, test as base } from '@playwright/test';
import { DocumentPage } from '__e2e__/po/document.po';
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

  await page.goto(`${baseUrl}/${space.domain}?task=proposal`);

  // wait for a bit while redirect happens
  await expect(page.locator(`[data-test-active-path=proposal]`)).toBeVisible({ timeout: 40000 });

  await page.locator(`[data-test=goto-${space.domain}/${prop.path}]`).first().click();

  await expect(page.locator(`[data-test-active-path=proposal]`)).not.toBeVisible({ timeout: 20000 });
});
