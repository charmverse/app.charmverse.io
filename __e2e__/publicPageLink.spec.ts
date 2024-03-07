import type { Browser } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';

import { createUserAndSpace } from './utils/mocks';
import { generatePageWithLinkedPage } from './utils/pages';

let browser: Browser;

test.beforeAll(async ({ browser: _browser }) => {
  browser = _browser;
});

test('click on link for another public page in same workspace and make sure that page renders', async () => {
  // Arrange ------------------

  const loggedInPage = await browser.newContext().then((c) => c.newPage());

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  const { space } = await createUserAndSpace({ browserPage: loggedInPage, permissionConfigurationMode: 'open' });

  const firstPageId = v4();
  const secondPageId = v4();

  const firstPage = await generatePageWithLinkedPage({
    createdBy: space.createdBy,
    spaceId: space.id,
    id: firstPageId,
    title: 'First Page',
    pagePermissions: [
      { permissionLevel: 'view', spaceId: space.id },
      { permissionLevel: 'view', public: true, allowDiscovery: true }
    ],
    linkedPageId: secondPageId
  });

  const secondPage = await generatePageWithLinkedPage({
    createdBy: space.createdBy,
    spaceId: space.id,
    id: secondPageId,
    title: 'Second Page',
    pagePermissions: [
      { permissionLevel: 'view', spaceId: space.id },
      { permissionLevel: 'view', public: true, allowDiscovery: true }
    ],
    linkedPageId: firstPageId
  });

  const publicSharePrefix = `${baseUrl}/${space.domain}`;

  const firstPageUrl = `${publicSharePrefix}/${firstPage.path}`;
  const secondPageUrl = `${publicSharePrefix}/${secondPage.path}`;

  // Act

  const page = publicPage;

  // Visit the first page and go to the second page
  await page.goto(firstPageUrl);

  let secondPageNestedLink = page.locator(`data-test=nested-page-${secondPage.id}`);

  await expect(secondPageNestedLink).toBeVisible();

  await secondPageNestedLink.click();

  await page.waitForURL(secondPageUrl);

  // From the second page, go back to the first page
  const firstPageNestedLink = page.locator(`data-test=nested-page-${firstPage.id}`);

  await expect(firstPageNestedLink).toBeVisible();

  await firstPageNestedLink.click();

  await page.waitForURL(firstPageUrl);

  // Make sure the content still renders
  secondPageNestedLink = page.locator(`data-test=nested-page-${secondPage.id}`);

  await expect(secondPageNestedLink).toBeVisible();
});
