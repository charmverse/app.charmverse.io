import { test, expect } from 'e2e/testWithFixtures';

test.describe('Basic test', () => {
  test('Open the app and login', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('data-test=connect-home-pahe')).toBeVisible();

    await page.pause();
  });
});
