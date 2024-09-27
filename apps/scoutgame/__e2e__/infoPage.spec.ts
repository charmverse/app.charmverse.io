import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/scoutgame/testing/database';
import { randomIntFromInterval } from '@root/lib/utils/random';

import { expect, test } from './test';

test.describe('Info page', () => {
  test('Open the app to info page', async ({ page, infoPage }) => {
    await page.goto('/info');
    // Logged in user should be redirected
    await page.waitForURL('**/info');

    await expect(infoPage.container).toBeVisible();
  });
});
