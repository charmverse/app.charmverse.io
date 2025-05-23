import { expect } from '@playwright/test';
import type { DocumentPage } from '__e2e__/po/document.po';

import type { UserAndSpaceContext } from './utils/mocks';
import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';
import { test } from './utils/test';

type Fixtures = {
  documentPage: DocumentPage;
};

let mocked: UserAndSpaceContext;

test.describe.serial('Deleting a page', () => {
  test.beforeAll(async () => {
    mocked = await generateUserAndSpace({ isAdmin: true });
  });

  test('user can view an archived page in the trash modal', async ({ page, documentPage }) => {
    await login({ page, userId: mocked.user.id });
    await documentPage.goToPage({
      domain: mocked.space.domain,
      path: mocked.page.path
    });

    await documentPage.header.pageTopLevelMenu.click();
    await expect(documentPage.header.pageActionsMenu).toBeVisible();
    await documentPage.header.deleteCurrentPage.click();
    await expect(documentPage.header.pageActionsMenu).not.toBeVisible();
    await expect(documentPage.archivedBanner).toBeVisible();
    // refresh the page to make sure context is fresh
    await page.reload();
    await documentPage.openTrash();
    await expect(documentPage.trashModal).toBeVisible();
    await expect(documentPage.getTrashItem(mocked.page.id)).toBeVisible();
    await documentPage.trashModal.click();
  });

  test.skip('user can visit and restore an archived page', async ({ page, documentPage }) => {
    await login({ page, userId: mocked.user.id });
    await documentPage.goToPage({
      domain: mocked.space.domain,
      path: mocked.page.path
    });
    await expect(documentPage.archivedBanner).toBeVisible();
    await documentPage.restoreArchivedButton.click();
    await expect(documentPage.archivedBanner).not.toBeVisible();
  });

  // unskip this when we fix the test above from being flaky
  test.skip('user can visit and delete a page permanently', async ({ page, documentPage }) => {
    await login({ page, userId: mocked.user.id });
    await documentPage.goToPage({
      domain: mocked.space.domain,
      path: mocked.page.path
    });
    await documentPage.header.pageTopLevelMenu.click();
    await expect(documentPage.header.pageActionsMenu).toBeVisible();
    await documentPage.header.deleteCurrentPage.click();
    await expect(documentPage.header.pageActionsMenu).not.toBeVisible();
    await expect(documentPage.archivedBanner).toBeVisible();
    await documentPage.deletePermanentlyButton.click();
  });
});
