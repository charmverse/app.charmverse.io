import { mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Login page', () => {
  test('Should redirect logged-in users to home page', async ({ homePage, utils, page }) => {
    const builder = await mockBuilder({});
    await utils.loginAsUserId(builder.id);

    await page.goto('/login');

    await page.waitForURL('**/home');
    await expect(homePage.container).toBeVisible();
  });
});
