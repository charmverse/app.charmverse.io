import { mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Profile page', () => {
  test('Should redirect non-logged in users to login page', async ({ page, loginPage }) => {
    await page.goto('/profile');

    await page.waitForURL('**/login');
    await expect(loginPage.container).toBeVisible();
  });

  test('Clicking profile link should prompt user to go to login page', async ({ page, loginPage, profilePage }) => {
    await page.goto('/home');
    await profilePage.selectNavigationLink('/profile').click();

    // continue to login
    await expect(profilePage.signInModalButton).toBeVisible();
    await profilePage.signInModalButton.click();

    await page.waitForURL('**/login?redirectUrl=profile');
    await expect(loginPage.container).toBeVisible();
  });

  test('An onboarded user can access the profile page', async ({ page, profilePage, utils }) => {
    const builder = await mockBuilder({
      agreedToTermsAt: new Date(),
      onboardedAt: new Date()
    });
    await utils.loginAsUserId(builder.id);

    await page.goto('/home');
    await profilePage.selectNavigationLink('/profile').click();

    //  await page.waitForTimeout(1000000);
    // Logged in user should be redirected
    await page.waitForURL('**/profile*');
    await expect(profilePage.container).toBeVisible();
  });
});
