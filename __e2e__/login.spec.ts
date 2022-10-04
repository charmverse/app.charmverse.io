import { chromium, test } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { Wallet } from 'ethers';

import { baseUrl } from './config';
import { generateUserAndSpace } from './utils/mocks';
import { mockWeb3, mockWalletSignature } from './utils/web3';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test('login - allows user to login and see their workspace', async () => {

  const sandbox = await browser.newContext();
  const page = await sandbox.newPage();

  const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
  const wallet = new Wallet(privateKey);

  const { space, page: docPage, walletAddress } = await generateUserAndSpace({ walletAddress: wallet.address });

  await mockWeb3({
    page,
    context: { privateKey, walletAddress },
    init: ({ Web3Mock, context }) => {

      Web3Mock.mock({
        blockchain: 'ethereum',
        accounts: {
          return: [context.walletAddress]
        }
      });

    }
  });

  await page.goto(baseUrl);

  // should auto redirect to workspace
  await page.waitForURL(`**/${space.domain}/${docPage.path}`);
  await page.locator(`text=${docPage.title}`).first().waitFor();

});
