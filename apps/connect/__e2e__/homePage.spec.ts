import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { expect, test } from 'e2e/testWithFixtures';

import { randomIntFromInterval } from 'lib/utils/random';
import { sleep } from 'lib/utils/sleep';

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
  test('Open the app and go to home page', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('data-test=connect-home-page')).toBeVisible();

    const connectButton = page.locator('data-test=connect-with-farcaster');

    const farcasterModal = page.locator('data-test=farcaster-login-modal');

    await connectButton.click();

    await expect(farcasterModal).toBeVisible();
  });

  test('Save new user preferences and go to welcome page', async ({ page }) => {
    await loginBrowserUser({ browserPage: page, userId });

    await page.goto('/');

    // Logged in user should be redirected
    await page.waitForURL('**/welcome');

    const userEmail = page.locator('data-test=onboarding-email >> input');

    await userEmail.focus();

    const email = `test-${randomIntFromInterval(1, 1000000)}@gmail.com`;

    await page.keyboard.type(email);

    await expect(userEmail).toHaveValue(email);

    const notifyAboutGrants = page.locator('data-test=onboarding-notify-grants');

    await notifyAboutGrants.setChecked(true);

    const acceptTerms = page.locator('data-test=onboarding-accept-terms');

    await acceptTerms.setChecked(true);

    const finishOnboarding = page.locator('data-test=finish-onboarding');

    await finishOnboarding.click();

    await page.waitForResponse('**/welcome');

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
