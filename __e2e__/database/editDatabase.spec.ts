import type { User } from '@charmverse/core/prisma';
import type { Space } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import { DatabasePage } from '__e2e__/po/databasePage.po';
import { DocumentPage } from '__e2e__/po/document.po';
import { PagesSidebarPage } from '__e2e__/po/pagesSiderbar.po';

import { loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  pagesSidebar: PagesSidebarPage;
  document: DocumentPage;
  databasePage: DatabasePage;
};

const test = base.extend<Fixtures>({
  pagesSidebar: ({ page }, use) => use(new PagesSidebarPage(page)),
  document: ({ page }, use) => use(new DocumentPage(page)),
  databasePage: ({ page }, use) => use(new DatabasePage(page))
});

// Will be set by the first test
let spaceUser: User;
let space: Space;
let databasePagePath: string;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;
});

test.describe.serial('Edit database select properties', async () => {
  test('create a board', async ({ page, pagesSidebar, databasePage }) => {
    // Arrange ------------------
    await loginBrowserUser({
      browserPage: page,
      userId: spaceUser.id
    });

    await pagesSidebar.goToHomePage(space.domain);

    // Add the database page from the sidebar
    await expect(pagesSidebar.pagesSidebar).toBeVisible();

    await pagesSidebar.pagesSidebar.hover();

    await pagesSidebar.pagesSidebarAddPageButton.click();

    await expect(pagesSidebar.pagesSidebarSelectAddDatabaseButton).toBeVisible();

    await pagesSidebar.pagesSidebarSelectAddDatabaseButton.click();

    await expect(pagesSidebar.databasePage).toBeVisible();
    await page.pause();

    // Initialise the new database
    await expect(databasePage.selectNewDatabaseAsSource).toBeVisible();

    await databasePage.selectNewDatabaseAsSource.click();

    await expect(databasePage.addTablePropButton).toBeVisible();

    const pageUrl = page.url();
    databasePagePath = pageUrl.split('/')[pageUrl.length - 1];
  });

  test('edit a board', async ({ page, document, databasePage }) => {
    // Arrange ------------------
    await loginBrowserUser({
      browserPage: page,
      userId: spaceUser.id
    });

    await document.goToPage({
      domain: space.domain,
      path: databasePagePath
    });

    await expect(databasePage.databasePage).toBeVisible();

    // Add select property
    await expect(databasePage.addTablePropButton).toBeVisible();

    databasePage.addTablePropButton.click();

    const selectPropertyType = databasePage.getPropertyTypeOptionLocator('select');

    expect(selectPropertyType).toBeVisible();

    await selectPropertyType.click();

    // Create new card and close it
    await databasePage.addCardFromTableButton.click();

    await expect(databasePage.closeModal).toBeVisible();

    await databasePage.closeModal.click();

    // Edit the card
  });
});
