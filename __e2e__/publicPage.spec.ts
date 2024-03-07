import type { Page, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { Browser } from '@playwright/test';
import { chromium, expect, test as base } from '@playwright/test';

import { baseUrl } from 'config/constants';
import { createVote, generateBoard } from 'testing/setupDatabase';

import { DatabasePage } from './po/databasePage.po';
import { PagePermissionsDialog } from './po/pagePermissions.po';
import { generateUserAndSpace, logoutBrowserUser } from './utils/mocks';
import { generatePage } from './utils/pages';
import { login } from './utils/session';

let browser: Browser;
type Fixtures = {
  pagePermissions: PagePermissionsDialog;
  databasePage: DatabasePage;
};

const test = base.extend<Fixtures>({
  pagePermissions: ({ page }, use) => use(new PagePermissionsDialog(page)),
  databasePage: ({ page }, use) => use(new DatabasePage(page))
});

test.beforeAll(async ({ browser: _browser }) => {
  browser = _browser;
});

test.describe.serial('Make a page public and visit it', async () => {
  // Will be set by the first test
  let shareUrl = '';
  let boardPage: Page;
  let cardPage: Page;
  let spaceUser: User;

  test('make a page public', async ({ pagePermissions, page }) => {
    // Arrange ------------------
    const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });

    const { space, user } = await generateUserAndSpace();
    boardPage = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      viewType: 'gallery'
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

    await await expect(page.locator(`data-test=gallery-card-${cardPage.id}`)).toBeVisible();

    // 2. Open the share dialog and make the page public
    const permissionDialog = pagePermissions.permissionDialog;

    await permissionDialog.click();

    const publishTab = pagePermissions.publishTab;

    await expect(publishTab).toBeVisible();

    await publishTab.click({ force: true });

    await pagePermissions.publicShareToggle.click();

    shareUrl = `${baseUrl}/${domain}/${boardPage.path}`;

    await page.waitForResponse(/\/api\/permissions/);

    await pagePermissions.allowDiscoveryToggle.click();

    // 3. Copy the public link to the clipboard
    const shareLinkInput = page.locator('data-test=share-link').locator('input');

    await expect(shareLinkInput).toBeVisible();

    const inputValue = await shareLinkInput.inputValue();

    expect(inputValue.match(shareUrl)).not.toBe(null);
  });

  test('visit a public page with embedded poll', async () => {
    // Arrange ------------------
    const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await userContext.newPage();

    const { space, user } = await generateUserAndSpace();

    const createdPage = await generatePage({
      content: [],
      createdBy: user.id,
      spaceId: space.id
    });

    const createdVote = await createVote({
      pageId: createdPage.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2'],
      userVotes: ['1']
    });

    await prisma.page.update({
      where: {
        id: createdPage.id
      },
      data: {
        content: {
          type: 'doc',
          content: [
            {
              type: 'poll',
              attrs: {
                track: [],
                pollId: createdVote.id
              }
            }
          ]
        }
      }
    });

    await prisma.pagePermission.create({
      data: {
        page: { connect: { id: createdPage.id } },
        permissionLevel: 'view',
        public: true
      }
    });

    const domain = space.domain;

    const targetPage = `${baseUrl}/${domain}/${createdPage.path}`;

    await page.goto(targetPage);

    await expect(page.locator(`data-test=view-poll-details-button`).first()).not.toBeDisabled();
  });

  test('open a page with invalid domain and path', async ({ databasePage }) => {
    const publicContext = await browser.newContext({});

    const page = await publicContext.newPage();

    await page.goto('invalid-domain/not-existing-page-id');

    const loginPageContent = page.locator('data-test=login-page-content');

    await expect(loginPageContent).toBeVisible();
  });

  test('visit the public page', async ({ databasePage, page }) => {
    // Part B - Visit this page as a non logged in user
    await logoutBrowserUser({ browserPage: page });

    // 1. Visit the page
    await page.goto(shareUrl);

    // 2. Make sure the board renders
    const boardTitle = databasePage.boardTitle();

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
