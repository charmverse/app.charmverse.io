import type { User } from '@charmverse/core/prisma';
import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';

import { baseUrl } from 'config/constants';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { generateSchemasForAllSupportedFieldTypes } from 'testing/publicApi/schemas';
import { generateBoard } from 'testing/setupDatabase';

import { loginBrowserUser } from '../utils/mocks';

// Will be set by the first test
let spaceUser: User;
let space: Space;
let cardPagePath: string;

const boardSchema = generateSchemasForAllSupportedFieldTypes();

const cardPropertyValues = {
  [boardSchema.select.id]: boardSchema.select.options[0].id,
  [boardSchema.multiSelect.id]: [boardSchema.multiSelect.options[0].id, boardSchema.multiSelect.options[1].id],
  [boardSchema.number.id]: 5,
  [boardSchema.text.id]: 'Example text',
  [boardSchema.checkbox.id]: true
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
    addPageContent: true,
    boardTitle: 'Demo board',
    boardPageType: 'board',
    viewType: 'board',
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
  test('view a database card properties as a full page', async ({ page, documentPage }) => {
    // Arrange ------------------
    await loginBrowserUser({
      browserPage: page,
      userId: spaceUser.id
    });

    await page.goto(`${baseUrl}/${space.domain}/${cardPagePath}`);

    await expect(documentPage.cardDetailProperties).toBeVisible();

    const selectProps = await documentPage.getSelectProperties();

    // First field
    const multiSelect = selectProps[0];

    const multiSelectText = (await multiSelect.allInnerTexts())[0];

    expect(multiSelectText.split('\n')).toEqual([
      boardSchema.multiSelect.options[0].value,
      boardSchema.multiSelect.options[1].value
    ]);
    // Second field
    const select = selectProps[1];

    const selectText = (await select.allInnerTexts())[0].trim();

    expect(selectText).toEqual(boardSchema.select.options[0].value);
  });
});
