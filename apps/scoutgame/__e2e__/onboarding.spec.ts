import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/scoutgame/testing/database';
import { prettyPrint } from '@packages/utils/strings';
import { randomIntFromInterval } from '@root/lib/utils/random';

import { expect, test } from './test';

test.describe('Onboarding flow', () => {
  test('Open the app to home page and go to Sign In', async ({ page, homePage, loginPage }) => {
    await page.goto('/');
    await expect(homePage.getStartedButton).toBeVisible();
    await homePage.getStartedButton.click();
    await page.waitForURL('**/login');
    await expect(loginPage.container).toBeVisible();
  });

  test('Save new user preferences and get through onboarding', async ({ welcomePage, scoutPage, page, utils }) => {
    const newUser = await mockScout({
      onboardedAt: null,
      agreedToTermsAt: null,
      avatar: 'https://placehold.co/256'
    });
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
    await expect(welcomePage.notifyAboutGrants).toBeChecked();

    await welcomePage.acceptTerms.click();
    await expect(welcomePage.acceptTerms).toBeChecked();

    await welcomePage.submitExtraDetails.click();

    await page.waitForURL('**/welcome/how-it-works', { waitUntil: 'load' });

    // make sure we saved onboarding preferences
    const user = await prisma.scout.findFirstOrThrow({
      where: {
        id: newUser.id
      },
      select: {
        id: true,
        email: true,
        agreedToTermsAt: true,
        sendMarketing: true
      }
    });

    expect(user.sendMarketing).toBe(true);
    expect(user.agreedToTermsAt).not.toBeNull();
    expect(user.email).toBe(email);

    await Promise.all([page.waitForURL('**/scout', { waitUntil: 'load' }), welcomePage.continueButton.click()]);

    await expect(scoutPage.container).toBeVisible();

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

  test('Require terms of service agreement for user that was onboarded somehow', async ({
    page,
    welcomePage,
    utils
  }) => {
    const onboardedUser = await mockScout({
      agreedToTermsAt: null,
      onboardedAt: new Date()
    });
    await utils.loginAsUserId(onboardedUser.id);

    // Test redirect from home page
    await page.goto('/scout');
    await page.waitForURL('**/welcome');
    await expect(welcomePage.container).toBeVisible();
  });

  test('Require terms of service agreement for user', async ({ page, welcomePage, infoPage, utils }) => {
    const newUser = await mockScout({
      agreedToTermsAt: null,
      onboardedAt: null
    });
    await utils.loginAsUserId(newUser.id);

    // Test redirect from home page
    await page.goto('/');
    await page.waitForURL('**/welcome');
    await expect(welcomePage.container).toBeVisible();

    // Test redirect from scouts page
    await page.goto('/scout');
    await page.waitForURL('**/welcome');
    await expect(welcomePage.container).toBeVisible();

    // Test  that info page does not redirect
    await page.goto('/info');
    await page.waitForURL('**/info');
    await expect(infoPage.container).toBeVisible();
  });
});
