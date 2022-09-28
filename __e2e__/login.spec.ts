import { expect, test } from '@playwright/test';
import { v4 } from 'uuid';
import { baseUrl, mockWeb3 } from './utilities';

test('login - sets a cookie inside the user browser', async ({ page }) => {

  // Arrange

  await mockWeb3(page, () => {

    const walletAddress = '0xd73b04b0e696b0945283defa3eee453814758f1a';

    // @ts-ignore - added by mockWeb3
    Web3Mock.mock({
      blockchain: 'ethereum',
      accounts: {
        return: [walletAddress]
      }
    });
  });

  await page.goto('http://localhost:3000/');
  await page.locator('text=Connect Wallet').click();
  await page.locator('text=Connect Wallet').click();
  await page.locator('text=Connected').waitFor();

  // await page.request.post(`${baseUrl}/api/profile`, {
  //   data: {
  //     address: walletAddress
  //   }
  // });

  const cookies = await page.context().cookies();

  // Assert
  expect(cookies.some(cookie => cookie.name === 'charm.sessionId')).toBe(true);

});
