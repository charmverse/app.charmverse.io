import { test, expect } from 'e2e/testWithFixtures';

test.describe('Basic test', () => {
  test('Open the app and go to home page', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('data-test=connect-home-page')).toBeVisible();
  });
});
