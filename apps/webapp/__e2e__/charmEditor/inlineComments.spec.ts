import { expect } from '@playwright/test';
import type { DocumentPage } from '__e2e__/po/document.po';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';

import { test } from '../utils/test';

type Fixtures = {
  documentPage: DocumentPage;
};

test.skip('Create an inline comment in the charmEditor', async ({ documentPage }) => {
  const { space, user, page } = await generateUserAndSpace({ isAdmin: true });

  await loginBrowserUser({
    browserPage: documentPage.page,
    userId: user.id
  });

  await documentPage.goToPage({
    domain: space.domain,
    path: page.path
  });

  await expect(documentPage.charmEditor).toBeVisible();
  await documentPage.contextMenuButton.click();
  await documentPage.contextMenuViewCommentsButton.click();
  await expect(documentPage.commentsSidebar).toBeVisible();
  await expect(documentPage.commentsSidebarEmptyMessage).toBeVisible();

  await documentPage.typeText('This is a test');
  await documentPage.charmEditor.dblclick();
  await documentPage.page.locator('data-test=add-inline-comment-button').click();
  await documentPage.page.locator('data-test=inline-comment-menu >> data-test=charm-editor-input').type('one comment');
  await documentPage.page.locator('data-test=save-new-inline-comment-button').click();
  await expect(documentPage.commentsSidebarEmptyMessage).not.toBeVisible();
  const commentInput = documentPage.commentsSidebar.locator(
    'data-test=comment-message >> data-test=charm-editor-input'
  );
  await expect(commentInput).toBeVisible();
  expect(await commentInput.evaluate((node) => (node as HTMLElement).innerText)).toBe('one comment');

  // Close the sidebar and check if the inline comment can be seen in the popover
  await documentPage.closeSidebar.click();
  await documentPage.charmverseInlineCommentIcon.click();
  await expect(documentPage.charmverseInlineCommentThread).toBeVisible();
});
