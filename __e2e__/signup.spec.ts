import { chromium, test } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { Wallet } from 'ethers';
import { baseUrl, mockWeb3 } from './utils';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test('signup - allows user to sign up and create a workspace using Metamask wallet', async () => {

  const sandbox = await browser.newContext();
  const page = await sandbox.newPage();

  await mockWeb3(page, () => {

    const walletAddress = Wallet.createRandom().address;

    // @ts-ignore
    Web3Mock.mock({
      blockchain: 'ethereum',
      accounts: {
        return: [walletAddress]
      }
    });

  });

  const uniqueDomain = Math.random().toString().replace('.', '');

  await page.goto(baseUrl);

  // wait for the welcome page to appear (login page will be automatically skipped once the wallet is connected)
  await page.waitForURL('**/signup');
  await page.locator('data-test=goto-create-workspace').click();

  await page.waitForURL('**/createWorkspace');
  await page.locator('data-test=workspace-domain-input').fill(uniqueDomain);
  await page.locator('data-test=create-workspace').click();

  await page.waitForURL(`**/${uniqueDomain}`);
  await page.locator('text=[Your DAO] Home').first().waitFor();

});
