import { Browser, chromium, expect, test } from '@playwright/test';
import { baseUrl } from 'testing/mockApiCall';
import { createUserAndSpace } from 'testing/playwright';

let browser: Browser;

test.beforeAll(async () => {
  // Change headless to false to visually debug the test
  browser = await chromium.launch({ headless: true });
});

test('public page - makes a page public', async () => {

  // Arrange ------------------
  const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await userContext.newPage();

  const { user: profile, space, pages } = await createUserAndSpace({ browserPage: page });

  const domain = space.domain;

  const boardPage = pages.find(p => p.type === 'board' && p.title.match(/tasks/i) !== null);

  await page.goto(`${baseUrl}`);

  const targetRedirectPath = `${baseUrl}/${domain}/${boardPage?.path}`;

  await page.goto(targetRedirectPath);

  // Act ----------------------
  // Part A - Prepare the page as a logged in user
  // 1. Make sure the board page exists and cards are visible
  await page.waitForResponse(/\/api\/blocks/);

  await expect(page.locator('data-test=kanban-card').first()).toBeVisible();

  // 2. Open the share dialog and make the page public
  await page.locator('data-test=toggle-page-permissions-dialog').click();

  const publicShareToggle = page.locator('data-test=toggle-public-page');

  await publicShareToggle.click();
  const shareUrl = `${baseUrl}/share/${domain}/${boardPage?.path}`;

  await page.waitForResponse(/\/api\/permissions/);

  // 3. Copy the public link to the clipboard
  const shareLinkInput = page.locator('data-test=share-link').locator('input');

  const inputValue = await shareLinkInput.inputValue();

  expect(inputValue.match(shareUrl)).not.toBe(null);

  const copyButton = page.locator('data-test=copy-button');

  await expect(copyButton).toBeVisible();

  await copyButton.click({ force: true });

  const clipboardContent = await page.evaluate(async () => {
    return navigator.clipboard.readText();
  });

  expect(clipboardContent.match(shareUrl)).not.toBe(null);

  // Part B - Visit this page as a non logged in user
  const publicContext = await browser.newContext({});

  const page1 = await publicContext.newPage();

  // 1. Visit the page
  await page1.goto(clipboardContent);

  // 2. Make sure the board renders
  const boardTitle = page.locator('data-test=board-title').locator('input');

  await expect(boardTitle).toBeVisible();

  expect(await boardTitle.inputValue()).toBe(boardPage?.title);

  // 3. Wait for the card, click on it
  const cardToOpen = page1.locator('data-test=kanban-card').first();
  await expect(cardToOpen).toBeVisible();

  await cardToOpen.click();

  // 4. Open the card and make sure it renders content
  await page1.waitForURL(`${shareUrl}*cardId*`);

  const openedCardUrl = await page1.evaluate(() => window.location.href);

  const queryParams = new URLSearchParams(openedCardUrl.split('?')[1]);

  const openedCardId = queryParams.get('cardId');

  const openedCardPage = pages.find(p => p.id === openedCardId);

  expect(openedCardPage).toBeDefined();

  const cardPopup = page1.locator('data-test=page-dialog');

  await expect(cardPopup).toBeVisible();

  const documentTitle = cardPopup.locator('data-test=editor-page-title');

  await expect(documentTitle).toBeVisible();

  expect(await documentTitle.innerText()).toBe(openedCardPage?.title);

});

