import { chromium, test } from '@playwright/test';
import type { Browser } from '@playwright/test';

import { baseUrl } from './config';
import { generateUserAndSpace } from './utils/mocks';
import { mockWeb3 } from './utils/web3';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test('login - allows user to login and see their workspace', async () => {

  const sandbox = await browser.newContext();
  const page = await sandbox.newPage();

  const { space, page: docPage, address, privateKey } = await generateUserAndSpace();

  await mockWeb3({
    page,
    context: { privateKey, address },
    init: ({ Web3Mock, context }) => {

      Web3Mock.mock({
        blockchain: 'ethereum',
        accounts: {
          return: [context.address]
        }
      });

    }
  });

  await page.goto(baseUrl);

  // should auto redirect to workspace
  await page.waitForURL(`**/${space.domain}/${docPage.path}`);
  await page.locator(`text=${docPage.title}`).first().waitFor();

});
