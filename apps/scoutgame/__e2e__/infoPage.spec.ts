import { mockScout } from '@packages/scoutgame/testing/database';

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

test.describe('Info page partners', () => {
  test('Open Optimism from the home page', async ({ page, homePage, infoPage, utils }) => {
    const newUser = await mockScout({
      onboardedAt: new Date(),
      agreedToTermsAt: new Date(),
      avatar: 'https://placehold.co/256'
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/home');
    await homePage.optimismPromoCard.click();

    await expect(infoPage.optimismContainer).toBeVisible();
  });
  test('Open Moxie from the home page', async ({ page, homePage, infoPage, utils }) => {
    const newUser = await mockScout({
      onboardedAt: new Date(),
      agreedToTermsAt: new Date(),
      avatar: 'https://placehold.co/256'
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/home');
    await homePage.moxiePromoCard.click();

    await expect(infoPage.moxieContainer).toBeVisible();
  });
});
