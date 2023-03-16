import { expect, test } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';

test.describe.serial('Add a new space from sidebar and load it', async () => {
  test('Fill the form and create a new space', async ({ page }) => {
    const { space, user } = await generateUserAndSpace({
      skipOnboarding: false
    });

    await login({ page, userId: user.id });

    const domain = space.domain;
    const targetPage = `${baseUrl}/${domain}`;

    await page.goto(targetPage);
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    const memberProfileNftList = page.locator('data-test=member-profile-nft-list');
    const memberProfileOrgList = page.locator('data-test=member-profile-org-list');
    const memberProfilePoapList = page.locator('data-test=member-profile-poap-list');
    await expect(memberProfileNftList).toBeVisible();
    await expect(memberProfileOrgList).toBeVisible();
    await expect(memberProfilePoapList).toBeVisible();

    const closePropertiesModalBtn = page.locator('data-test=close-modal');
    await expect(closePropertiesModalBtn).toBeVisible();
    await closePropertiesModalBtn.click();
  });
});
