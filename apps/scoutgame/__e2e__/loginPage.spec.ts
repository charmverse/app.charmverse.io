import { mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Login page', () => {
  test('Should redirect logged-in users to home page', async ({ homePage, utils, page }) => {
    const builder = await mockBuilder({});

    await page.goto('/');
    await page.waitForURL('**/home');
    await expect(homePage.container).toBeVisible();

    await homePage.signInButton.click();
    await page.waitForURL('**/login');

    const signInWithWarpcast = page.locator('data-test=sign-in-with-warpcast');
    await expect(signInWithWarpcast).not.toBeDisabled();
    await signInWithWarpcast.click();

    const warpcastModal = page.locator('data-test=farcaster-modal');
    await expect(warpcastModal).toBeVisible();

    await utils.loginAsUserId(builder.id);

    await page.goto('/home');
    await page.waitForURL('**/home');
    await expect(homePage.container).toBeVisible();

    const userPill = page.locator('data-test=user-menu-pill');
    await expect(userPill).toBeVisible();
  });
});
