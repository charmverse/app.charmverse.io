import { expect, test } from './test';

test.describe('Home page', () => {
  test('Open the app and go to profile page as a public user', async ({ page, homePage }) => {
    await page.goto('/');
    // Logged in user should be redirected
    await page.waitForURL('**/home');

    await expect(homePage.container).toBeVisible();
  });
});
