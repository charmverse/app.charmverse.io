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
  test('Open the app to terms page', async ({ page, infoPage }) => {
    await page.goto('/info/terms');
    // Logged in user should be redirected
    await page.waitForURL('**/info/terms');

    await expect(infoPage.termsContainer).toBeVisible();
  });
  test('Open the app to privacy page', async ({ page, infoPage }) => {
    await page.goto('/info/privacy-policy');
    // Logged in user should be redirected
    await page.waitForURL('**/info/privacy-policy');

    await expect(infoPage.privacyContainer).toBeVisible();
  });
  test('Open the app to dpa page', async ({ page, infoPage }) => {
    await page.goto('/info/dpa');
    // Logged in user should be redirected
    await page.waitForURL('**/info/dpa');

    await expect(infoPage.dpaContainer).toBeVisible();
  });
});
