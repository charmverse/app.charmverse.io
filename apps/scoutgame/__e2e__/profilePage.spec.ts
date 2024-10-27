import { mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Profile page', () => {
  test('Should redirect non-logged in users to login page', async ({ page, loginPage }) => {
    await page.goto('/profile');

    await page.waitForURL('**/login');
    const container = page.locator('data-test=profile-page');
    await expect(container).toBeVisible();
  });

  test('Clicking profile link should prompt user to go to login page', async ({ page, loginPage, profilePage }) => {
    await page.goto('/home');
    const link = page.locator(`data-test=site-navigation >> [href*="/profile"]`).first();
    await link.click();

    // continue to login
    const signInModalButton = page.locator('data-test=modal-sign-in-button');
    await expect(signInModalButton).toBeVisible();
    await signInModalButton.click();

    await page.waitForURL('**/login?redirectUrl=profile');
    const container = page.locator('data-test=profile-page');
    await expect(container).toBeVisible();
  });

  test('An onboarded user can access the profile page', async ({ page, profilePage, utils }) => {
    const builder = await mockBuilder({
      agreedToTermsAt: new Date(),
      onboardedAt: new Date()
    });
    await utils.loginAsUserId(builder.id);

    await page.goto('/home');
    const link = page.locator(`data-test=site-navigation >> [href*="/profile"]`).first();
    await link.click();

    // Logged in user should be redirected
    await page.waitForURL('**/profile*');
    const container = page.locator('data-test=profile-page');
    await expect(container).toBeVisible();
  });
});
