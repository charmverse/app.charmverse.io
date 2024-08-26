import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { test } from 'playwright/test';

import { loginBrowserUser } from './utils/loginBrowserUser';

test.describe('Invalid user in profile page', () => {
  test('Click refresh and go back to homepage', async ({ page }) => {
    const userId = await testUtilsUser.generateUser().then((user) => user.id);

    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        connectOnboarded: true
      }
    });

    await loginBrowserUser({ browserPage: page, userId });

    await prisma.user.delete({
      where: { id: userId }
    });

    await page.goto('/profile');

    await page.waitForURL('**/profile');

    const invalidUserButton = page.locator('data-test=invalidate-user-button');
    await invalidUserButton.click();

    await page.waitForURL('**/');
  });
});
