// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
// capture actions on the pages in signup flow
export class ForumPostPage {
  readonly page: Page;

  readonly newTopLevelCommentInputLocator: Locator;

  readonly newTopLevelCommentSubmitButtonLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTopLevelCommentInputLocator = this.page.locator('data-test=new-top-level-post-comment');
    this.newTopLevelCommentSubmitButtonLocator = this.newTopLevelCommentInputLocator.locator(
      'data-test=post-comment-button'
    );
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
