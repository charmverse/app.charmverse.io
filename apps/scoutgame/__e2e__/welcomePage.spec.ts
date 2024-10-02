import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/scoutgame/testing/database';
import { randomIntFromInterval } from '@root/lib/utils/random';

import { expect, test } from './test';

test.describe('Welcome page - onboarding flow', () => {
  test('Open the app to home page and go to Sign In', async ({ page, homePage, loginPage }) => {
    await page.goto('/');
    // Logged in user should be redirected
    await page.waitForURL('**/home');

    await expect(homePage.container).toBeVisible();

    await homePage.signInButton.click();

    await page.waitForURL('**/login');
    await expect(loginPage.container).toBeVisible();
  });

  test('Save new user preferences and get through onboarding', async ({ welcomePage, homePage, page, utils }) => {
    const newUser = await mockScout();
    await utils.loginAsUserId(newUser.id);

    // Logged in user should be redirected automatically
    await page.goto('/welcome');

    await expect(welcomePage.userEmailInput).toBeEditable();
    await expect(welcomePage.notifyAboutGrants).toBeVisible();
    await expect(welcomePage.acceptTerms).toBeVisible();

    const email = `test-${randomIntFromInterval(1, 1000000)}@gmail.com`;

    await welcomePage.userEmailInput.fill(email);
    await expect(welcomePage.userEmailInput).toHaveValue(email);

    await welcomePage.notifyAboutGrants.focus();
    expect(await welcomePage.notifyAboutGrants.isChecked()).toBe(true);

    await welcomePage.acceptTerms.click();

    await welcomePage.submitExtraDetails.click();

    await page.waitForURL('**/welcome/builder');

    // make sure we saved onboarding preferences
    const user = await prisma.scout.findFirstOrThrow({
      where: {
        id: newUser.id
      },
      select: {
        id: true,
        sendMarketing: true
      }
    });

    expect(user.sendMarketing).toBe(true);

    await welcomePage.continueButton.click();

    await page.waitForURL('**/welcome/how-it-works');

    await welcomePage.continueButton.click();

    await page.waitForURL('**/home');

    await expect(homePage.container).toBeVisible();

    // make sure we saved onboarding preferences
    const userAfterOnboarding = await prisma.scout.findFirstOrThrow({
      where: {
        id: newUser.id
      },
      select: {
        id: true,
        onboardedAt: true
      }
    });

    expect(!!userAfterOnboarding.onboardedAt).toBe(true);
  });
});
