import { mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Sign Out', () => {
  test('Should be able to sign out', async ({ homePage, utils, page }) => {
    const builder = await mockBuilder({});

    await utils.loginAsUserId(builder.id);
    await page.goto('/home');
    await page.waitForURL('**/home');

    const userPill = page.locator('data-test=user-menu-pill');
    await expect(userPill).toBeVisible();
    await userPill.click();
    const signOutButton = page.locator('data-test=sign-out-button');
    await signOutButton.click();

    const signInButton = page.locator('data-test=sign-in-button');
    await expect(signInButton).toBeVisible();
  });
});
