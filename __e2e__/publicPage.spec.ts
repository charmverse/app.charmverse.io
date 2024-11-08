import { prisma } from '@charmverse/core/prisma-client';
import { expect } from '@playwright/test';
import { baseUrl } from '@root/config/constants';

import { createVote, generateBoard } from 'testing/setupDatabase';

import { DatabasePage } from './po/databasePage.po';
import { test } from './testWithFixtures';
import { generateUserAndSpace, generateUser } from './utils/mocks';
import { generatePage } from './utils/pages';
import { login } from './utils/session';

test.describe('Public pages', async () => {
  test('make a page public', async ({ browser, pagePermissionsDialog, page }) => {
    const { space, user } = await generateUserAndSpace();
    const boardPage = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      viewType: 'gallery'
    });

    await login({ userId: user.id, page });

    const cardPage = await prisma.page.findFirstOrThrow({
      where: {
        type: 'card',
        parentId: boardPage.id
      }
    });

    const targetPage = `${baseUrl}/${space.domain}/${boardPage.path}`;

    await page.goto(targetPage);

    // Act ----------------------
    // Part A - Prepare the page as a logged in user
    // 1. Make sure the board page exists and cards are visible

    await expect(page.locator(`data-test=gallery-card-${cardPage.id}`)).toBeVisible();

    // 2. Open the share dialog and make the page public
    const permissionDialog = pagePermissionsDialog.permissionDialog;

    await permissionDialog.click();

    const publishTab = pagePermissionsDialog.publishTab;

    await expect(publishTab).toBeVisible();

    await publishTab.click({ force: true });

    await pagePermissionsDialog.publicShareToggle.click();

    const shareUrl = `${baseUrl}/${space.domain}/${boardPage.path}`;

    await page.waitForResponse(/\/api\/permissions/);

    await pagePermissionsDialog.allowDiscoveryToggle.click();

    // 3. Copy the public link to the clipboard
    const shareLinkInput = page.locator('data-test=share-link').locator('input');
    await expect(shareLinkInput).toHaveValue(new RegExp(shareUrl));

    // Part B - Visit this page as a non logged in user

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    // 1. Visit the page
    await anonPage.goto(shareUrl);

    // 2. Make sure the board renders
    const boardTitle = new DatabasePage(anonPage).boardTitle();
    await expect(boardTitle).toHaveValue(boardPage?.title);
  });

  test('visit a public page with embedded poll', async ({ page }) => {
    const { space, user } = await generateUserAndSpace();

    const createdPage = await generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [{ public: true, permissionLevel: 'view' }]
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

    const domain = space.domain;

    const targetPage = `${baseUrl}/${domain}/${createdPage.path}`;

    await page.goto(targetPage);

    await expect(page.locator(`data-test=view-poll-details-button`).first()).not.toBeDisabled();
  });

  test('open a page with invalid domain and path', async ({ page }) => {
    await page.goto('invalid-domain/not-existing-page-id');

    const loginPageContent = page.locator('data-test=login-page-content');

    await expect(loginPageContent).toBeVisible();
  });

  test('open a card on a public database', async ({ databasePage, page }) => {
    const { space, user } = await generateUserAndSpace();
    const boardPage = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      viewType: 'gallery',
      permissions: [{ public: true, permissionLevel: 'view' }]
    });

    const cardPage = await prisma.page.findFirstOrThrow({
      where: {
        type: 'card',
        parentId: boardPage.id
      }
    });

    const shareUrl = `${baseUrl}/${space.domain}/${boardPage.path}`;

    // 1. Visit the page
    await page.goto(shareUrl);

    // 2. Make sure the board renders
    const boardTitle = databasePage.boardTitle();
    await expect(boardTitle).toHaveValue(boardPage?.title);

    // 3. Wait for the card, click on it
    const cardToOpen = page.locator(`data-test=gallery-card-${cardPage.id}`).and.locator('[data-test-resolved]');
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
    await expect(documentTitle).toHaveText(cardPage.title);

    // 5. Make sure page is displayed using public layout
    const publicPageLayout = page.locator('data-test=public-page-layout');
    await expect(publicPageLayout).toBeVisible();
  });

  test('visit shared page as logged in user', async ({ page, documentPage }) => {
    const { space, user } = await generateUserAndSpace();

    const createdPage = await generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [{ public: true, permissionLevel: 'view' }]
    });

    await login({ userId: user.id, page });

    const shareUrl = `${baseUrl}/${space.domain}/${createdPage.path}`;

    // 1. Visit the page
    await page.goto(shareUrl);

    // 3. Make sure page is displayed using space layout
    const spacePageLayout = page.locator('data-test=space-page-layout');
    await expect(spacePageLayout).toBeVisible();

    // 2. Make sure the content renders
    await expect(documentPage.documentTitle).toHaveText(createdPage.title);
  });

  test('show the sidebar for free tier spaces', async ({ page, documentPage, pagesSidebar }) => {
    const { space, user } = await generateUserAndSpace({ paidTier: 'community' });

    const publicPage = await generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [{ public: true, permissionLevel: 'view' }]
    });

    const shareUrl = `${baseUrl}/${space.domain}/${publicPage.path}`;

    // Check sidebar is not visible for normal tier
    await page.goto(shareUrl);
    await expect(documentPage.documentTitle).toBeVisible();
    await expect(pagesSidebar.pagesSidebar).not.toBeVisible();

    // Set space to 'free' tier
    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        paidTier: 'free'
      }
    });

    // Check sidebar is visible
    await page.goto(shareUrl);
    await expect(pagesSidebar.pagesSidebar).toBeVisible();

    const anonUser = await generateUser();
    await login({ userId: anonUser.id, page });

    // Check sidebar is visible
    await page.goto(shareUrl);
    await expect(pagesSidebar.pagesSidebar).toBeVisible();
  });
});
