import { chromium, test } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { baseUrl, generateUserAndSpace, mockWeb3 } from './utils';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});
test('login - allows user to login and see their workspace', async () => {

  const sandbox = await browser.newContext();
  const page = await sandbox.newPage();
  const { space, page: docPage, walletAddress } = await generateUserAndSpace();

  await mockWeb3(page, { walletAddress }, context => {

    // @ts-ignore
    Web3Mock.mock({
      blockchain: 'ethereum',
      accounts: {
        return: [context.walletAddress]
      }
    });

  });

  await page.goto(baseUrl);

  // should redirect to workspace
  await page.waitForURL(`**/${space.domain}/${docPage.path}`);
  await page.locator('text=[Your DAO]sdfdfddf Home').first().waitFor();

});
