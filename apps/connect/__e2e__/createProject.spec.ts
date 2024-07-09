import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { expect, test } from 'e2e/testWithFixtures';

import { randomIntFromInterval } from 'lib/utils/random';
import { sleep } from 'lib/utils/sleep';

import { loginBrowserUser } from './utils/loginBrowserUser';

test('Open the app and go to home page', async ({ page }) => {
  const userId = await testUtilsUser.generateUser().then((user) => user.id);

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      connectOnboarded: true
    }
  });

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

  await loginBrowserUser({ browserPage: page, userId });

  await page.goto('/');

  await page.waitForURL('**/profile');

  const createProject = page.locator('data-test=create-project');

  await createProject.click();

  await page.waitForURL('**/projects/new');

  await page.pause();
});
