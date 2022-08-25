import { test, expect } from '@playwright/test';
import { v4 } from 'uuid';
import { baseUrl, registerUser } from 'testing/mockApiCall';

// test('public page should open', async ({ page }) => {

//   const rawDomain = baseUrl.replace(/^https?:\/\//, '').replace(/:\d{4}/, '');

//   console.log(rawDomain);

//   // Arrange
//   const walletAddress = v4();

//   await page.request.post(`${baseUrl}/api/profile`, {
//     data: {
//       address: walletAddress
//     }
//   });

//   await page.goto(baseUrl as string);
//   // Act

//   // Assert

//   expect(true).toBe(true);

// });

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
