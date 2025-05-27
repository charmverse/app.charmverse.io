import { baseUrl } from '@packages/config/constants';
import { expect } from '@playwright/test';
import { v4 } from 'uuid';

import { test } from './testWithFixtures';
import { createUserAndSpace } from './utils/mocks';
import { generatePageWithLinkedPage } from './utils/pages';

test('click on link for another public page in same workspace and make sure that page renders', async ({ page }) => {
  const { space } = await createUserAndSpace({ browserPage: page, permissionConfigurationMode: 'open' });

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
