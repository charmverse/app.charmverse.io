import { expect, test } from '@playwright/test';
import type { Space } from '@prisma/client';

import { baseUrl } from 'config/constants';

import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';

test.describe.serial('Add a new space from sidebar and load it', async () => {
  test('Fill the form and create a new space', async ({ page }) => {
    // Arrange ------------------
    // const userContext = await browser.newContext();
    // const page = await userContext.newPage();

    const { space, user } = await generateUserAndSpace();

    await login({ page, userId: user.id });

    const domain = space.domain;
    const targetPage = `${baseUrl}/${domain}`;

    await page.goto(targetPage);
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Act ----------------------
    // Part A - Prepare the page as a logged in user
    // 1. Click on the space menu button to open the dropdown
    const memberProfileNftList = await page.locator('data-test=member-profile-nft-list');
    const memberProfileOrgList = await page.locator('data-test=member-profile-org-list');
    const memberProfilePoapList = await page.locator('data-test=member-profile-poap-list');
    await expect(memberProfileNftList).toBeVisible();
    await expect(memberProfileOrgList).toBeVisible();
    await expect(memberProfilePoapList).toBeVisible();

    // Await new onboarding form popup so we can close it and click on new space
    const closePropertiesModalBtn = await page.locator('data-test=close-member-properties-modal');
    await expect(closePropertiesModalBtn).toBeVisible();
    await closePropertiesModalBtn.click();
  });
});
