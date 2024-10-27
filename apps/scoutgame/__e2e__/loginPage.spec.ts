import { mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Login page', () => {
  test('Should redirect logged-in users to home page', async ({ homePage, utils, page }) => {
    const builder = await mockBuilder({});

    await page.goto('/');
    const signInButton = page.locator('data-test=sign-in-button');
    await signInButton.click();
    await page.waitForURL('**/login');
    await utils.loginAsUserId(builder.id);

    const signInWithWarpcast = page.locator('data-test=sign-in-with-warpcast');
    await signInWithWarpcast.click();

    const warpcastModal = page.locator('data-test=farcaster-modal');
    await expect(warpcastModal).toBeVisible();

    await page.reload();
    await page.waitForURL('**/home');
    await expect(homePage.container).toBeVisible();

    const userPill = page.locator('data-test=user-menu-pill');
    await expect(userPill).toBeVisible();
  });
});
