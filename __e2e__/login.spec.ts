import { test, expect } from '@playwright/test';
import { v4 } from 'uuid';
import { baseUrl } from './utilities';

test('login - sets a cookie inside the user browser', async ({ page }) => {

  // Arrange
  const walletAddress = v4();

  // Act
  await page.request.post(`${baseUrl}/api/profile`, {
    data: {
      address: walletAddress
    }
  });

  const cookies = await page.context().cookies();

  // Assert
  expect(cookies.some(cookie => cookie.name === 'charm.sessionId')).toBe(true);

});
