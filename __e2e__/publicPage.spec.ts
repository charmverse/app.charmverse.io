import type { Browser } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';
import type { Page } from '@prisma/client';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages/interfaces';

import { createUserAndSpace } from './utils/mocks';
import { mockWeb3 } from './utils/web3';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test.describe.serial('Make a page public and visit it', async () => {
  // Will be set by the first test
  let shareUrl = '';
  let boardPage: IPageWithPermissions;
  let cardPage: Page;
  let pages: IPageWithPermissions[] = [];

  test('make a page public', async () => {

    // Arrange ------------------
    const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await userContext.newPage();

    const { space, pages: spacePages, address, privateKey } = await createUserAndSpace({ browserPage: page });

    await mockWeb3({
      page,
      context: { address, privateKey },
      init: ({ Web3Mock, context }) => {

        Web3Mock.mock({
          blockchain: 'ethereum',
          accounts: {
            return: [context.address]
          }
        });

      }
    });

    pages = spacePages;

    const domain = space.domain;

    boardPage = pages.find(p => p.type === 'board' && p.title.match(/tasks/i) !== null) as IPageWithPermissions;

    cardPage = await prisma.page.findFirst({
      where: {
        type: 'card',
        parentId: boardPage?.id
      }
    }) as Page;

    const targetPage = `${baseUrl}/${domain}/${boardPage?.path}`;

    await page.goto(targetPage);

    // Act ----------------------
    // Part A - Prepare the page as a logged in user
    // 1. Make sure the board page exists and cards are visible

    await expect(page.locator(`data-test=kanban-card-${cardPage.id}`)).toBeVisible();

    // 2. Open the share dialog and make the page public
    const permissionDialog = page.locator('data-test=toggle-page-permissions-dialog');

    await permissionDialog.click();

    const publicShareToggle = page.locator('data-test=toggle-public-page');

    await publicShareToggle.click();
    shareUrl = `${baseUrl}/share/${domain}/${boardPage?.path}`;

    await page.waitForResponse(/\/api\/permissions/);

    // 3. Copy the public link to the clipboard
    const shareLinkInput = page.locator('data-test=share-link').locator('input');

    const inputValue = await shareLinkInput.inputValue();

    expect(inputValue.match(shareUrl)).not.toBe(null);

    // const copyButton = page.locator('data-test=copy-button');

    // await expect(copyButton).toBeVisible();

    // await copyButton.click({ force: true });

    // const clipboardContent = await page.evaluate(async () => {
    //   return navigator.clipboard.readText();
    // });

    // expect(clipboardContent.match(shareUrl)).not.toBe(null);

    // // Set the share URL we will visit to be the exact clipboard content
    // shareUrl = clipboardContent;

  });

  test('visit the public page', async () => {

    // Part B - Visit this page as a non logged in user
    const publicContext = await browser.newContext({});

    const page = await publicContext.newPage();

    // 1. Visit the page
    await page.goto(shareUrl);

    // 2. Make sure the board renders
    const boardTitle = page.locator('data-test=board-title').locator('input');

    await expect(boardTitle).toBeVisible();

    expect(await boardTitle.inputValue()).toBe(boardPage?.title);

    // 3. Wait for the card, click on it
    const cardToOpen = page.locator(`data-test=kanban-card-${cardPage.id}`);
    await expect(cardToOpen).toBeVisible();

    await cardToOpen.click();

    // 4. Open the card and make sure it renders content
    await page.waitForURL(`${shareUrl}*cardId*`);

    const openedCardUrl = await page.evaluate(() => window.location.href);

    const queryParams = new URLSearchParams(openedCardUrl.split('?')[1]);

    const openedCardId = queryParams.get('cardId');

    const openedCardPage = pages.find(p => p.id === openedCardId);

    expect(openedCardPage).toBeDefined();

    const cardPopup = page.locator('div.Dialog');

    await expect(cardPopup).toBeVisible();

    const documentTitle = cardPopup.locator('data-test=editor-page-title');

    await expect(documentTitle).toBeVisible();

    expect(await documentTitle.innerText()).toBe(openedCardPage?.title);

  });

});

