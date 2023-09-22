import type { User } from '@charmverse/core/prisma';
import type { Block, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { user } from '@guildxyz/sdk';
import { expect, test } from '__e2e__/testWithFixtures';
import { v4 as uuid } from 'uuid';

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

let cardComment: Block;

const exampleText = 'User comment on card';

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
      path: true,
      id: true,
      parentId: true
    }
  });

  cardPagePath = card.path;

  cardComment = await prisma.block.create({
    data: {
      id: uuid(),
      parentId: card.id,
      rootId: card.parentId as string,
      schema: 1,
      title: 'Comment',
      type: 'comment',
      updatedBy: spaceUser.id,
      space: { connect: { id: space.id } },
      user: { connect: { id: spaceUser.id } },
      fields: {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: exampleText }]
            }
          ]
        }
      }
    }
  });
});

test.describe.serial('Edit database select properties', async () => {
  test('view a database card properties and comments as a full page', async ({ page, documentPage }) => {
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

    const cardCommentBlock = documentPage.getCardCommentContent(cardComment.id);

    await expect(cardCommentBlock).toBeVisible();

    const cardCommentBlockText = (await cardCommentBlock.allInnerTexts())[0];

    expect(cardCommentBlockText).toMatch(exampleText);
  });
});
