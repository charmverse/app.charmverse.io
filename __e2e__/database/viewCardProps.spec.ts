import type { User } from '@charmverse/core/prisma';
import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { baseUrl } from 'config/constants';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { DatabasePage } from 'testing/__e2e__/po/databasePage.po';
import type { DocumentPage } from 'testing/__e2e__/po/document.po';
import type { PagesSidebarPage } from 'testing/__e2e__/po/pagesSiderbar.po';
import { test, expect } from 'testing/__e2e__/testWithFixtures';
import { generateSchemasForAllSupportedFieldTypes } from 'testing/publicApi/schemas';
import { generateBoard } from 'testing/setupDatabase';

import { loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  pagesSidebar: PagesSidebarPage;
  document: DocumentPage;
  databasePage: DatabasePage;
};
// Will be set by the first test
let spaceUser: User;
let space: Space;
let cardPagePath: string;

const boardSchema = generateSchemasForAllSupportedFieldTypes();
const cardPropertyValues = {
  [boardSchema.select.id]: boardSchema.select.options[0].id,
  [boardSchema.multiSelect.id]: [boardSchema.multiSelect.options[0].id, boardSchema.multiSelect.options[1].id],
  [boardSchema.number.id]: 5,
  [boardSchema.text.id]: 'Example text'
};

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;

  const database = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    cardCount: 1,
    customProps: {
      cardPropertyValues,
      propertyTemplates: Object.values(boardSchema) as IPropertyTemplate[]
    }
  });

  const card = await prisma.page.findFirstOrThrow({
    where: {
      type: 'card',
      parentId: database.id
    },
    select: {
      path: true
    }
  });

  cardPagePath = card.path;
});

test.describe.serial('Edit database select properties', async () => {
  test('view a database card properties as a full page', async ({
    page,
    documentPage,
    pagesSidebar,
    databasePage,
    globalPage
  }) => {
    // Arrange ------------------
    await loginBrowserUser({
      browserPage: page,
      userId: spaceUser.id
    });

    await page.goto(`${baseUrl}/${space.domain}/${cardPagePath}`);

    await expect(documentPage.cardDetailProperties).toBeVisible();

    await page.pause();
  });
});
