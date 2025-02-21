import type { Space, User, Block, Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { generateBoard } from '@packages/testing/setupDatabase';
import { test as base, expect } from '@playwright/test';
import { baseUrl } from '@root/config/constants';
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
let linkedDatabasePagePath: string;
let linkedDatabasePageId: string;
let firstDatabase: Page;
let secondDatabase: Page;
let thirdDatabase: Page;
let fourthDatabase: Page;
let sourceCards: Block[];
const sourceDatabaseCardCount = 8;

const firstDatabaseSelectSchema = generateSchema({
  type: 'select',
  options: ['OneA', 'OneB']
});

const secondDatabaseSelectSchema = generateSchema({
  type: 'select',
  options: ['TwoA', 'TwoB']
});

const thirdDatabaseSelectSchema = generateSchema({
  type: 'select',
  options: ['ThreeA', 'ThreeB']
});

const fourthDatabaseSelectSchema = generateSchema({
  type: 'select',
  options: ['FourA', 'FourB']
});

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;
  firstDatabase = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardTitle: 'One',
    boardPageType: 'board',
    cardCount: sourceDatabaseCardCount,
    customProps: {
      propertyTemplates: [firstDatabaseSelectSchema],
      cardPropertyValues: {
        [firstDatabaseSelectSchema.id]: firstDatabaseSelectSchema.options[0].id
      }
    }
  });

  secondDatabase = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardTitle: 'Two',
    boardPageType: 'board',
    cardCount: sourceDatabaseCardCount,
    customProps: {
      propertyTemplates: [secondDatabaseSelectSchema],
      cardPropertyValues: {
        [secondDatabaseSelectSchema.id]: secondDatabaseSelectSchema.options[0].id
      }
    }
  });

  thirdDatabase = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardTitle: 'Three',
    boardPageType: 'board',
    cardCount: sourceDatabaseCardCount,
    customProps: {
      propertyTemplates: [thirdDatabaseSelectSchema],
      cardPropertyValues: {
        [thirdDatabaseSelectSchema.id]: thirdDatabaseSelectSchema.options[0].id
      }
    }
  });

  fourthDatabase = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardTitle: 'Four',
    boardPageType: 'board',
    cardCount: sourceDatabaseCardCount,
    customProps: {
      propertyTemplates: [fourthDatabaseSelectSchema],
      cardPropertyValues: {
        [fourthDatabaseSelectSchema.id]: fourthDatabaseSelectSchema.options[0].id
      }
    }
  });
});

test('navigate through databases', async ({ page, pagesSidebar, databasePage }) => {
  // Arrange ------------------
  await loginBrowserUser({
    browserPage: page,
    userId: spaceUser.id
  });

  await page.goto(`${baseUrl}/${space.domain}/proposals`);

  await expect(pagesSidebar.pagesSidebar).toBeVisible();

  const databases = [
    { page: firstDatabase, prop: firstDatabaseSelectSchema },
    { page: secondDatabase, prop: secondDatabaseSelectSchema },
    { page: thirdDatabase, prop: thirdDatabaseSelectSchema },
    { page: fourthDatabase, prop: fourthDatabaseSelectSchema }
  ];

  for (const db of databases) {
    await pagesSidebar.getSidebarPageLink(db.page.id).click();

    await databasePage.waitForDocumentPage({
      domain: space.domain,
      path: db.page.path
    });

    const firstCard = await prisma.block.findFirstOrThrow({
      where: {
        type: 'card',
        rootId: db.page.id
      },
      select: {
        id: true
      }
    });

    const selectProp = databasePage.getTablePropertySelectLocator({
      cardId: firstCard.id
    }).closedSelect;

    await expect(selectProp).toBeVisible();

    await expect((await selectProp.allInnerTexts())[0]).toEqual(db.prop.options[0].value);
  }
});
