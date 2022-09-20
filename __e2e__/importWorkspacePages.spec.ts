import { Browser, chromium, expect, test } from '@playwright/test';
import { Block, Page } from '@prisma/client';
import { prisma } from 'db';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';
import { baseUrl, createUserAndSpace } from './utilities';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test('view a card created via workspace import', async () => {

  // Arrange ------------------
  const loggedInUserContext = await browser.newContext();
  const page = await loggedInUserContext.newPage();

  const { space } = await createUserAndSpace({ browserPage: page, permissionConfigurationMode: 'open' });

  await importWorkspacePages({
    exportName: 'test-stub',
    targetSpaceIdOrDomain: space.domain
  });

  // Find a gallery voew
  const boardView = await prisma.block.findFirst({
    where: {
      type: 'view',
      fields: {
        path: ['viewType'],
        equals: 'board'
      },
      spaceId: space.id
    }
  }) as Block;

  expect(boardView).toBeDefined();

  const boardPage = await prisma.page.findFirst({
    where: {
      id: boardView?.rootId,
      type: 'board',
      spaceId: space.id
    }
  }) as Page;

  // Get corresponding card
  const cardToClick = await prisma.page.findFirst({
    where: {
      type: 'card',
      parentId: boardPage.id
    }
  }) as Page;

  expect(boardPage).toBeTruthy();
  expect(cardToClick).toBeTruthy();

  // Act ------------------
  const boardUrl = `${baseUrl}/${space.domain}/${boardPage.path}`;

  await page.goto(boardUrl);

  // Make sure the board shows
  const boardTitle = page.locator('data-test=board-title').locator('input');

  await expect(boardTitle).toBeVisible();

  expect(await boardTitle.inputValue()).toBe(boardPage?.title);

  // Make sure we can click in our random card
  const cardLocator = page.locator(`data-test=kanban-card-${cardToClick.id}`);

  await expect(cardLocator).toBeVisible();

  await cardLocator.click();

  // 4. Open the card and make sure it renders content
  await page.waitForURL(`${boardUrl}*cardId*`);

  const cardPopup = page.locator('div.Dialog');

  await expect(cardPopup).toBeVisible();

  const documentTitle = await cardPopup.locator('data-test=editor-page-title').locator('textarea').first();

  await expect(documentTitle).toBeVisible();

  expect(await documentTitle.inputValue()).toBe(cardToClick?.title);

});
