import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { expect, test } from 'playwright/test';

import { randomIntFromInterval } from 'lib/utils/random';

import { loginBrowserUser } from './utils/loginBrowserUser';

let userId: string;

test.beforeAll(async () => {
  userId = await testUtilsUser.generateUser().then((user) => user.id);

  const randomInt = randomIntFromInterval(1, 1000000);

  await prisma.farcasterUser.create({
    data: {
      fid: randomInt,
      userId,
      account: {
        username: `example-user-${randomInt}`,
        displayName: `display-${randomInt}`,
        bio: 'dev user',
        pfpUrl: 'https://example.com/pfp.png'
      }
    }
  });
});

test.describe('Home page', () => {
  // test('Open the app and go to home page', async ({ page }) => {
  //   await page.goto('/');

  //   await expect(page.locator('data-test=connect-home-page')).toBeVisible();

  //   const connectButton = page.locator('data-test=connect-with-farcaster');

  //   // We are using the modal from Farcaster SDK, so we target by expected text
  //   const farcasterModal = page.getByText("Scan with your phone's camera to continue.");

  //   await connectButton.click();

  //   await expect(farcasterModal).toBeVisible();
  // });

  test('Save new user preferences and go to welcome page', async ({ page }) => {
    await loginBrowserUser({ browserPage: page, userId });

    await page.goto('/');

    // Logged in user should be redirected
    await page.waitForURL('**/welcome');

    const userEmail = page.locator('data-test=onboarding-email >> input');

    await expect(userEmail).toBeEditable();

    await userEmail.focus();

    const email = `test-${randomIntFromInterval(1, 1000000)}@gmail.com`;

    await page.keyboard.type(email);

    await expect(userEmail).toHaveValue(email);

    const notifyAboutGrants = page.locator('data-test=onboarding-notify-grants');

    await notifyAboutGrants.setChecked(true);

    const acceptTerms = page.locator('data-test=onboarding-accept-terms');

    await acceptTerms.setChecked(true);

    const finishOnboarding = page.locator('data-test=finish-onboarding');

    await page.pause();

    await Promise.all([page.waitForResponse('**/welcome'), finishOnboarding.click()]);

    const user = await prisma.user.findFirstOrThrow({
      where: {
        id: userId
      },
      select: {
        id: true,
        emailNewsletter: true
      }
    });

    await expect(user.emailNewsletter).toBe(true);

    await page.waitForURL('**/profile');
  });
});
