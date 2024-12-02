import { mockBuilder, mockScout, mockUserWeeklyStats } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

async function mockLeaderboard() {
  const builder = await mockBuilder();
  const userWeeklyStats = await mockUserWeeklyStats({ userId: builder.id });
  return { builder, userWeeklyStats };
}

test.describe('Scout page', () => {
  test('Open the app and go to profile page as a public user', async ({ page, scoutPage, utils }) => {
    const newUser = await mockScout({
      onboardedAt: null,
      agreedToTermsAt: null,
      avatar: 'https://placehold.co/256'
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/');
    // Logged in user should be redirected
    await page.waitForURL('**/scout');

    await expect(scoutPage.container).toBeVisible();
  });
  test('Can navigate to each scouts table tab', async ({ page, scoutPage, utils }) => {
    // add some mock data
    await mockLeaderboard();

    const newUser = await mockScout({
      onboardedAt: new Date(),
      agreedToTermsAt: new Date(),
      avatar: 'https://placehold.co/256'
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/scout');
    await expect(scoutPage.container).toBeVisible();

    // Find the first scouts tab which is not hidden
    const scoutsTab = scoutPage.container.locator('data-test=tab-scouts').last();
    await scoutsTab.click();

    const scoutTable = scoutPage.container.locator('data-test=scouts-table').last();
    await expect(scoutTable).toBeVisible();

    const newScoutsTab = scoutPage.container.locator('data-test=tab-new-scouts').last();
    await newScoutsTab.click();

    const newScoutTable = scoutPage.container.locator('data-test=new-scouts-table').last();
    await expect(newScoutTable).toBeVisible();
  });
});
