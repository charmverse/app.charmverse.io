import type { User } from '@charmverse/core/prisma';
import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBoard } from '@packages/testing/setupDatabase';
import { baseUrl } from '@root/config/constants';
import { expect, test } from '__e2e__/testWithFixtures';

import { loginBrowserUser } from '../utils/mocks';

// Will be set by the first test
let spaceUser: User;
let space: Space;
let databasePagePath: string;
let cardId: string;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;

  const database = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardTitle: 'Demo board',
    boardPageType: 'board',
    viewType: 'table',
    cardCount: 1,
    customProps: {}
  });

  ({ id: cardId } = await prisma.block.findFirstOrThrow({
    where: {
      rootId: database.id,
      type: 'card'
    },
    select: {
      id: true
    }
  }));

  databasePagePath = database.path;
});

test.describe.serial('Edit database select properties', async () => {
  test('Add a property from a card and have it show in the table', async ({
    page,
    databasePage,
    dialogDocumentPage
  }) => {
    // Arrange ------------------
    await loginBrowserUser({
      browserPage: page,
      userId: spaceUser.id
    });

    await page.goto(`${baseUrl}/${space.domain}/${databasePagePath}`);

    const firstRow = databasePage.getTableRowByIndex({ index: 0 });

    await expect(firstRow).toBeVisible();

    await firstRow.hover();

    await databasePage.getTableRowOpenLocator(cardId).click();

    await expect(dialogDocumentPage.openAsPageButton).toBeVisible();

    await dialogDocumentPage.addCustomPropertyButton.click();

    await databasePage.getPropertyTypeOptionLocator({ type: 'person' }).click();

    await dialogDocumentPage.closeDialog();

    await expect(dialogDocumentPage.closeModal).not.toBeVisible();

    await expect(databasePage.getTablePropertyHeaderLocator({ type: 'person' })).toBeVisible();
  });
});
