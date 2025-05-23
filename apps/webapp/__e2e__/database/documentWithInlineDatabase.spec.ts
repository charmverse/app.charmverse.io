import type { Block, Space, User, Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { baseUrl } from '@packages/config/constants';
import type { IPropertyTemplate } from '@packages/databases/board';
import type { CardFields } from '@packages/databases/card';
import { generateBoard } from '@packages/testing/setupDatabase';
import { expect } from '@playwright/test';
import { DatabasePage } from '__e2e__/po/databasePage.po';
import { DocumentPage } from '__e2e__/po/document.po';

import { getDatabaseWithSchema } from 'lib/public-api/getDatabaseWithSchema';

import { test } from '../testWithFixtures';
import { loginBrowserUser } from '../utils/mocks';

import { generatePageContentWithInlineDatabaseRefs } from './pageWithInlinestub';

// Will be set by the first test
let spaceUser: User;
let space: Space;
let documentPage: Page;
let inlineLinkedDatabase: Page;
let inlineDatabase: Page;
let standaloneDatabase: Page;
let standaloneDatabaseSelectPropertyTemplate: IPropertyTemplate;
let sourceCards: Block[];
const sourceDatabaseCardCount = 8;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;

  standaloneDatabase = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardPageType: 'board',
    cardCount: sourceDatabaseCardCount
  });

  standaloneDatabaseSelectPropertyTemplate = await getDatabaseWithSchema({ databaseId: standaloneDatabase.id }).then(
    ({ schema }) => schema.find((p) => p.type === 'select') as IPropertyTemplate
  );

  expect(standaloneDatabaseSelectPropertyTemplate).toBeDefined();

  sourceCards = await prisma.block.findMany({
    where: {
      rootId: standaloneDatabase.id,
      type: 'card'
    }
  });

  expect(sourceCards).toHaveLength(sourceDatabaseCardCount);

  documentPage = await testUtilsPages.generatePage({
    spaceId: space.id,
    createdBy: spaceUser.id,
    type: 'page'
  });

  inlineDatabase = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardPageType: 'inline_board',
    views: 1,
    cardCount: sourceDatabaseCardCount
  });

  inlineLinkedDatabase = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    addPageContent: true,
    boardPageType: 'inline_linked_board',
    views: 1,
    cardCount: 0,
    linkedSourceId: standaloneDatabase.id
  });

  await prisma.page.update({
    where: {
      id: documentPage.id
    },
    data: {
      content: generatePageContentWithInlineDatabaseRefs({
        inlineDBPageId: inlineDatabase.id,
        inlineLinkedDBPageId: inlineLinkedDatabase.id
      })
    }
  });
});

test('view linked databases inside a document', async ({ page, databasePage }) => {
  // Arrange ------------------
  await loginBrowserUser({
    browserPage: page,
    userId: spaceUser.id
  });

  await page.goto(`${baseUrl}/${space.domain}/${documentPage.path}`);

  // Test the inline database ----------------
  await expect(databasePage.getDatabaseContainer({ boardId: inlineLinkedDatabase.id })).toBeVisible();

  for (const card of sourceCards) {
    const row = databasePage.getTableRowByCardId({ cardId: card.id, boardId: inlineLinkedDatabase.id });

    await expect(row).toBeVisible();

    const selectProp = databasePage.getTablePropertySelectLocator({
      cardId: card.id,
      boardId: inlineLinkedDatabase.id
    }).closedSelect;

    await expect(selectProp).toBeVisible();

    const value = (card.fields as CardFields).properties[standaloneDatabaseSelectPropertyTemplate.id] as string;

    const valueLabel = standaloneDatabaseSelectPropertyTemplate.options.find((option) => option.id === value)?.value;

    expect(valueLabel).toBeDefined();

    await expect(selectProp).toHaveText(valueLabel as string);
  }

  // Test the inline database which has its own cards ----------------
  const inlineDatabaseCards = await prisma.block.findMany({
    where: {
      rootId: inlineDatabase.id,
      type: 'card'
    }
  });

  await expect(databasePage.getDatabaseContainer({ boardId: inlineDatabase.id })).toBeVisible();

  for (const card of inlineDatabaseCards) {
    const row = databasePage.getTableRowByCardId({ cardId: card.id, boardId: inlineDatabase.id });

    await expect(row).toBeVisible();

    const selectProp = databasePage.getTablePropertySelectLocator({
      cardId: card.id,
      boardId: inlineDatabase.id
    }).closedSelect;

    await expect(selectProp).toBeVisible();

    const value = (card.fields as CardFields).properties[standaloneDatabaseSelectPropertyTemplate.id] as string;

    const valueLabel = standaloneDatabaseSelectPropertyTemplate.options.find((option) => option.id === value)?.value;

    expect(valueLabel).toBeDefined();

    await expect(selectProp).toHaveText(valueLabel as string);
  }
});
