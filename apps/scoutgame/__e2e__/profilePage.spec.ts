import { mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Profile page', () => {
  test('Should redirect non-logged in users to login page', async ({ page, loginPage }) => {
    await page.goto('/profile');

    await page.waitForURL('**/login');
    await expect(loginPage.container).toBeVisible();
  });

  test('An onboarded user can access the profile page', async ({ page, profilePage, utils }) => {
    const builder = await mockBuilder({
      onboardedAt: new Date()
    });
    await utils.loginAsUserId(builder.id);

    await page.goto('/');
    await profilePage.selectNavigationLink('/profile').click();

    // Logged in user should be redirected
    await page.waitForURL('**/profile');
    await expect(profilePage.container).toBeVisible();
  });
});
