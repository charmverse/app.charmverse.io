import { test as base, expect } from '@playwright/test';

// Define a custom test fixture
export const test = base.extend({
  page: async ({ page }, use) => {
    // Set up routing for all requests
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      // rewrite the CDN requests to local server
      if (url.startsWith('https://cdn.charmverse.io/')) {
        const newUrl = url.replace('https://cdn.charmverse.io/', 'http://localhost:3337/');
        // console.log(`Redirecting ${url} to ${newUrl}`);
        await route.fulfill({
          status: 301,
          headers: {
            Location: newUrl
          }
        });
      } else {
        await route.continue();
      }
    });

    // Use the page with the custom routing
    await use(page);
  }
});

// Re-export expect
export { expect };
