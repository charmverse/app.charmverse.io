import type { Space, User, Block, Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl } from '@packages/config/constants';
import type { IPropertyTemplate } from '@packages/databases/board';
import type { CardFields } from '@packages/databases/card';
import { generateBoard } from '@packages/testing/setupDatabase';
import { expect } from '@playwright/test';
import type { DatabasePage } from '__e2e__/po/databasePage.po';
import type { DocumentPage } from '__e2e__/po/document.po';
import type { PagesSidebarPage } from '__e2e__/po/pagesSidebar.po';

import { getDatabaseWithSchema } from 'lib/public-api/getDatabaseWithSchema';

import { test } from '../testWithFixtures';
import { loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  pagesSidebar: PagesSidebarPage;
  document: DocumentPage;
  databasePage: DatabasePage;
};

// Will be set by the first test
let spaceUser: User;
let space: Space;
let linkedDatabasePagePath: string;
let linkedDatabasePageId: string;
let sourceDatabase: Page;
let sourceDatabaseSelectPropertyTemplate: IPropertyTemplate;
let sourceCards: Block[];
const sourceDatabaseCardCount = 8;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;
  sourceDatabase = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardPageType: 'board',
    cardCount: sourceDatabaseCardCount
  });

  sourceDatabaseSelectPropertyTemplate = await getDatabaseWithSchema({ databaseId: sourceDatabase.id }).then(
    ({ schema }) => schema.find((p) => p.type === 'select') as IPropertyTemplate
  );

  expect(sourceDatabaseSelectPropertyTemplate).toBeDefined();

  sourceCards = await prisma.block.findMany({
    where: {
      rootId: sourceDatabase.id,
      type: 'card'
    }
  });

  expect(sourceCards).toHaveLength(sourceDatabaseCardCount);
});

test.describe.serial('Create linked databases', async () => {
  test('create a linked database', async ({ page, pagesSidebar, databasePage }) => {
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
    await expect(databasePage.selectLinkedDatabaseAsSource()).toBeVisible();

    await databasePage.selectLinkedDatabaseAsSource().click();

    // Wait until the database is initialised
    const sourceBoardOption = databasePage.linkedDatabaseOption({ sourceBoardId: sourceDatabase.id });

    await expect(sourceBoardOption).toBeVisible();

    await sourceBoardOption.click();

    const pageUrl = page.url();
    linkedDatabasePagePath = pageUrl
      .split(baseUrl as string)[1]
      .split('/')[2]
      .split('?')[0];

    linkedDatabasePageId = await prisma.page
      .findFirstOrThrow({ where: { path: linkedDatabasePagePath, spaceId: space.id } })
      .then((p) => p.id);

    for (const card of sourceCards) {
      const row = databasePage.getTableRowByCardId({ cardId: card.id });

      await expect(row).toBeVisible();

      const selectProp = databasePage.getTablePropertySelectLocator({ cardId: card.id }).closedSelect;

      await expect(selectProp).toBeVisible();

      const value = (card.fields as CardFields).properties[sourceDatabaseSelectPropertyTemplate.id] as string;

      const valueLabel = sourceDatabaseSelectPropertyTemplate.options.find((option) => option.id === value)?.value;

      expect(valueLabel).toBeDefined();

      await expect(selectProp).toHaveText(valueLabel as string);
    }
  });

  test('navigate to a linked database', async ({ page, databasePage }) => {
    await loginBrowserUser({
      browserPage: page,
      userId: spaceUser.id
    });

    await page.goto(`${baseUrl}/${space.domain}/${linkedDatabasePagePath}`);

    await expect(databasePage.getDatabaseContainer({ boardId: linkedDatabasePageId })).toBeVisible();

    for (const card of sourceCards) {
      const row = databasePage.getTableRowByCardId({ cardId: card.id });

      await expect(row).toBeVisible();

      const selectProp = databasePage.getTablePropertySelectLocator({ cardId: card.id }).closedSelect;

      await expect(selectProp).toBeVisible();

      const value = (card.fields as CardFields).properties[sourceDatabaseSelectPropertyTemplate.id] as string;

      const valueLabel = sourceDatabaseSelectPropertyTemplate.options.find((option) => option.id === value)?.value;

      expect(valueLabel).toBeDefined();

      await expect(selectProp).toHaveText(valueLabel as string);
    }
  });
});
