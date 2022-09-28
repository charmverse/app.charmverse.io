import { test } from '@playwright/test';
import { baseUrl, mockWeb3 } from './utilities';

test('signup - allows user to sign up and create a workspace using Metamask wallet', async ({ page }) => {

  // Arrange

  await mockWeb3(page, () => {

    const walletAddress = '0xd73b04b0e696b0945283defa3eee453814758f1a';

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
