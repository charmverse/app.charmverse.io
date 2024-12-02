import { mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Profile page', () => {
  test('Should redirect non-logged in users to login page', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForURL('**/login');
    const container = page.locator('data-test=login-page');
    await expect(container).toBeVisible();
  });

  test('An onboarded user can access the profile page', async ({ page, utils }) => {
    const builder = await mockBuilder({
      agreedToTermsAt: new Date(),
      onboardedAt: new Date()
    });
    await utils.loginAsUserId(builder.id);

    await page.goto('/scout');
    const link = page.locator(`data-test=site-navigation >> [href*="/profile"]`).first();
    await link.click();

    // Logged in user should be redirected
    await page.waitForURL('**/profile*');
    const container = page.locator('data-test=profile-page');
    await expect(container).toBeVisible();
  });
});
