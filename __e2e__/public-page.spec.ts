import { Browser, chromium, test, expect } from '@playwright/test';
import { Space } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages/interfaces';
import { LoggedInUser } from 'models';
import { baseUrl } from 'testing/mockApiCall';
import { createUserAndSpace } from 'testing/playwright';
import { v4 } from 'uuid';

let browser: Browser;

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: false });
});

test('public page - makes a page public', async () => {

  const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await userContext.newPage();

  // Arrange
  const { user: profile, space, pages } = await createUserAndSpace({ browserPage: page });

  const domain = space.domain;

  // Act

  const boardPage = pages.find(p => p.type === 'board' && p.title.match(/tasks/i) !== null);

  //
  await page.goto(`${baseUrl}`);

  // Click p:has-text("[Your DAO] Home"

  const targetRedirectPath = `${baseUrl}/${domain}/${boardPage?.path}`;

  await page.goto(targetRedirectPath);

  await page.waitForResponse(/\/api\/blocks/);

  await page.locator('data-test=toggle-page-permissions-dialog').click();

  const publicShareToggle = await page.locator('data-test=toggle-public-page');

  await publicShareToggle.click();
  const shareUrl = `${baseUrl}/share/${domain}/${boardPage?.path}`;

  await page.waitForResponse(/\/api\/permissions/);

  // Test that the content of the input will contain the url and that it gets passed to the clipboard
  const shareLinkInput = await page.locator('data-test=share-link').locator('input');

  //  expect(shareLinkInput.innerText()).toBe(shareUrl);
  const inputValue = await shareLinkInput.inputValue();

  expect(inputValue.match(shareUrl)).not.toBe(null);

  await page.locator('data-test=copy-button').click({ force: true });

  const clipboardContent = await page.evaluate(async () => {
    return navigator.clipboard.readText();
  });

  expect(clipboardContent.match(shareUrl)).not.toBe(null);

  // Open new page as non logged in user ------------------------------------------------------
  const publicContext = await browser.newContext({});

  const page1 = await publicContext.newPage();

  // Go to http://localhost:3335/share/domain-3459c5af-272f-40f0-9dcf-899c85e95b72/page-19377272787222233
  await page1.goto(shareUrl);

  // Clipboard should contain the url and view ID
  await page1.waitForURL(`${clipboardContent}*`);

  const boardTitle = await page.locator('data-test=board-title').inputValue();

  expect(boardTitle).toBe(boardPage?.title);

  // Click text=Partner with CharmVerse
  await page1.locator('data-test=kanban-card').first().click();

  await page1.waitForURL(new RegExp(`${shareUrl}&cardId=`));

  // Click text=Not started
  await page1.locator('text=Open as page').isVisible();

  const openedCardUrl = await page.evaluate(() => window.location.href);

  const queryParams = new URLSearchParams(openedCardUrl.split('?')[1]);

  const openedCardId = queryParams.get('cardId');

  const openedCardPage = pages.find(p => p.id === openedCardId);

  expect(openedCardPage).toBeDefined();

  // Click div[role="dialog"] >> text=High
  await page1.locator('div[role="dialog"] >> text=High').click();

  // Click div[role="dialog"] >> text=Partnerships
  await page1.locator('div[role="dialog"] >> text=Partnerships').click();

  // Assert -------------

});

