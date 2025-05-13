import type { User, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';
import { DatabasePage } from '__e2e__/po/databasePage.po';
import { DocumentPage } from '__e2e__/po/document.po';
import { PagesSidebarPage } from '__e2e__/po/pagesSidebar.po';

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
let databasePageId: string;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;
});

test.describe.serial('Edit database select properties', async () => {
  test('create a database', async ({ page, pagesSidebar, databasePage }) => {
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

    // Initialise the new database
    await expect(databasePage.selectNewDatabaseAsSource()).toBeVisible();

    await databasePage.selectNewDatabaseAsSource().click();

    // Wait until the database is initialised
    await expect(databasePage.addCardFromTableButton()).toBeVisible();

    const pageUrl = page.url();
    databasePagePath = pageUrl
      .split(baseUrl as string)[1]
      .split('/')[2]
      .split('?')[0];

    databasePageId = await prisma.page
      .findFirstOrThrow({ where: { path: databasePagePath, spaceId: space.id } })
      .then((p) => p.id);
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
    await expect(databasePage.addTablePropButton()).toBeVisible();

    databasePage.addTablePropButton().click();

    const selectPropertyType = databasePage.getPropertyTypeOptionLocator({ type: 'select' });

    expect(selectPropertyType).toBeVisible();

    await selectPropertyType.click();
    // Create new card and close it
    await databasePage.addCardFromTableButton().click();

    // Leave time for all creation processes to happen
    await page.waitForTimeout(500);

    await databasePage.closeModal.click();

    const card = await prisma.page.findFirstOrThrow({ where: { parentId: databasePageId } });

    const { closedSelect, openSelect } = databasePage.getTablePropertySelectLocator({
      cardId: card.id
    });

    await expect(closedSelect).toBeVisible();

    await closedSelect.click();

    await expect(openSelect).toBeVisible();

    await openSelect.focus();

    const optionValue = 'Option 1';

    await openSelect.type(optionValue);

    await openSelect.press('Enter');

    await expect(openSelect).not.toBeVisible();

    await expect(closedSelect).toBeVisible();

    await page.waitForTimeout(500);

    const textValue = (await closedSelect.allInnerTexts()).join('');

    expect(textValue).toMatch(optionValue);
  });
});
