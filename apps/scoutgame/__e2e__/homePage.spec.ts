import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';
import { mockBuilder, mockUserWeeklyStats } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

async function mockLeaderboard() {
  const builder = await mockBuilder();
  const userWeeklyStats = await mockUserWeeklyStats({ userId: builder.id });
  return { builder, userWeeklyStats };
}

test.describe('Home page', () => {
  test('Open the app and go to profile page as a public user', async ({ page, homePage }) => {
    await page.goto('/');
    // Logged in user should be redirected
    await page.waitForURL('**/home');

    await expect(homePage.container).toBeVisible();
  });
  test('Can navigate to each tab', async ({ page, homePage }) => {
    // add some mock data
    await mockLeaderboard();

    await page.goto('/home');
    await expect(homePage.container).toBeVisible();

    for (const tab of homePage.tabs) {
      await homePage.selectTab(tab);
      await expect(homePage.tabView(tab)).toBeVisible();
    }
    await homePage.selectTab('leaderboard');
    await expect(homePage.tabView('leaderboard')).toBeVisible();
  });
});
