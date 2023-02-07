// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';
// capture actions on the pages in signup flow
export class ForumPostPage {
  readonly page: Page;

  readonly newTopLevelCommentInputLocator: Locator;

  readonly newTopLevelCommentSubmitButtonLocator: Locator;

  readonly postCharmeditor: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTopLevelCommentInputLocator = this.page.locator('data-test=new-top-level-post-comment');
    this.newTopLevelCommentSubmitButtonLocator = this.newTopLevelCommentInputLocator.locator(
      'data-test=post-comment-button'
    );
    this.postCharmeditor = this.page.locator('data-test=post-charmeditor').locator('div[contenteditable]');
  }

  async isPostEditable() {
    const isEditable = await this.postCharmeditor.getAttribute('contenteditable');
    return isEditable === 'true';
  }

  async goToPostPage({ domain, path }: { domain: string; path: string }) {
    await this.page.goto(`${baseUrl}/${domain}/forum/post/${path}`);
  }

  getCommentLocator(commentId: string) {
    return this.page.locator(`data-test=post-comment-${commentId}`);
  }

  getPostPageTitleLocator() {
    return this.page.locator('data-test=editor-page-title');
  }

  async waitForPostLoad({ domain, path }: { domain: string; path: string }) {
    await this.page.waitForURL(`**/${domain}/forum/post/${path}`);
  }
}
