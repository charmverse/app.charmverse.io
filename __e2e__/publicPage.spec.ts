import type { Browser } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';
import type { Page, User } from '@prisma/client';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';
import { generateBoard } from 'testing/setupDatabase';

import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test.describe.serial('Make a page public and visit it', async () => {
  // Will be set by the first test
  let shareUrl = '';
  let boardPage: Page;
  let cardPage: Page;
  let spaceUser: User;

  test('make a page public', async () => {
    // Arrange ------------------
    const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await userContext.newPage();

    const { space, user } = await generateUserAndSpace();
    boardPage = await generateBoard({
      spaceId: space.id,
      createdBy: user.id
    });

    spaceUser = user;
    await login({ userId: user.id, page });

    const domain = space.domain;

    cardPage = (await prisma.page.findFirst({
      where: {
        type: 'card',
        parentId: boardPage.id
      }
    })) as Page;

    expect(cardPage).toBeDefined();

    const targetPage = `${baseUrl}/${domain}/${boardPage.path}`;

    await page.goto(targetPage);

    // Act ----------------------
    // Part A - Prepare the page as a logged in user
    // 1. Make sure the board page exists and cards are visible

    await expect(page.locator(`data-test=gallery-card-${cardPage.id}`)).toBeVisible();

    // 2. Open the share dialog and make the page public
    const permissionDialog = page.locator('data-test=toggle-page-permissions-dialog');

    await permissionDialog.click();

    const publicShareToggle = page.locator('data-test=toggle-public-page');

    await publicShareToggle.click();
    shareUrl = `${baseUrl}/${domain}/${boardPage.path}`;

    await page.waitForResponse(/\/api\/permissions/);

    // 3. Copy the public link to the clipboard
    const shareLinkInput = page.locator('data-test=share-link').locator('input');

    const inputValue = await shareLinkInput.inputValue();

    expect(inputValue.match(shareUrl)).not.toBe(null);
  });

  test('open a page with invalid domain and path', async () => {
    const publicContext = await browser.newContext({});

    const page = await publicContext.newPage();

    await page.goto('invalid-domain/not-existing-page-id');

    const loginPageContent = page.locator('data-test=login-page-content');

    await expect(loginPageContent).toBeVisible();
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
    const cardToOpen = page.locator(`data-test=gallery-card-${cardPage.id}`);
    await expect(cardToOpen).toBeVisible();

    await cardToOpen.click();

    // 4. Open the card and make sure it renders content
    await page.waitForURL(`${shareUrl}*cardId*`);

    const openedCardUrl = await page.evaluate(() => window.location.href);

    const queryParams = new URLSearchParams(openedCardUrl.split('?')[1]);

    const openedCardId = queryParams.get('cardId');

    expect(openedCardId).toBeDefined();

    const cardPopup = page.locator('div.Dialog');

    await expect(cardPopup).toBeVisible();

    const documentTitle = cardPopup.locator('data-test=editor-page-title');

    await expect(documentTitle).toBeVisible();

    expect(await documentTitle.innerText()).toMatch(cardPage.title);

    // 5. Make sure page is displayed using public layout
    const publicPageLayout = page.locator('data-test=public-page-layout');
    await expect(publicPageLayout).toBeVisible();
  });

  test('visit shared page as logged in user', async () => {
    const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });

    const page = await userContext.newPage();
    await login({ userId: spaceUser.id, page });

    // 1. Visit the page
    await page.goto(shareUrl);

    // 2. Make sure the board renders
    const boardTitle = page.locator('data-test=board-title').locator('input');

    await expect(boardTitle).toBeVisible();

    expect(await boardTitle.inputValue()).toBe(boardPage?.title);

    // 3. Make sure page is displayed using space layout
    const spacePageLayout = page.locator('data-test=space-page-layout');
    await expect(spacePageLayout).toBeVisible();
  });
});
