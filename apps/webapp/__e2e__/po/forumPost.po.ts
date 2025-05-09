// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';
// capture actions on the pages in signup flow
export class ForumPostPage {
  readonly page: Page;

  readonly newTopLevelCommentInputLocator: Locator;

  readonly newTopLevelCommentSubmitButtonLocator: Locator;

  readonly postCharmeditor: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTopLevelCommentInputLocator = this.page.locator('data-test=new-top-level-post-comment');
    this.newTopLevelCommentSubmitButtonLocator =
      this.newTopLevelCommentInputLocator.locator('data-test=comment-button');
    this.postCharmeditor = this.page.locator('data-test=post-charmeditor').locator('div[contenteditable]').first();
  }

  // Navigation utilities
  async goToPostPage({ domain, path }: { domain: string; path: string }) {
    await this.page.goto(`${baseUrl}/${domain}/forum/post/${path}`);
  }

  getPostPageTitleLocator() {
    return this.page.locator('data-test=editor-page-title');
  }

  // Post charmeditor utilities
  async isPostEditable() {
    const isEditable = await this.postCharmeditor.getAttribute('contenteditable');
    return isEditable === 'true';
  }

  async waitForPostLoad({ domain, path }: { domain: string; path: string }) {
    await this.page.waitForURL(`**/${domain}/forum/post/${path}`);
  }

  // Comment-level utilities
  getCommentLocator(commentId: string) {
    return this.page.locator(`data-test=comment-${commentId}`);
  }

  getDeletedCommentLocator(commentId: string) {
    return this.page.locator(`data-test=deleted-comment-${commentId}`);
  }

  async isCommentEditable(commentId: string) {
    const commentEditor = await this.page.locator(`data-test=comment-charmeditor-${commentId} >> div[contenteditable]`);
    const isEditable = await commentEditor.getAttribute('contenteditable');
    return isEditable === 'true';
  }

  getPostCommentMenuLocator(commentId: string) {
    return this.page.locator(`data-test=comment-menu-${commentId}`);
  }

  getPostEditCommentLocator(commentId: string) {
    return this.page.locator(`data-test=edit-comment-${commentId}`);
  }

  getPostDeleteCommentLocator(commentId: string) {
    return this.page.locator(`data-test=delete-comment-${commentId}`);
  }

  getPostSaveCommentButtonLocator(commentId: string) {
    return this.page.locator(`data-test=save-comment-${commentId}`);
  }
}
