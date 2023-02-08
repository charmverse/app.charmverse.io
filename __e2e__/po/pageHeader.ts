// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

// capture actions on the pages in signup flow
export class PageHeader {
  readonly page: Page;

  readonly pageTopLevelMenu: Locator;

  readonly forumPostActions: Locator;

  readonly deleteCurentPage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTopLevelMenu = this.page.locator('data-test=page-toplevel-menu');
    this.forumPostActions = this.page.locator('data-test=forum-post-actions');
    this.deleteCurentPage = this.page.locator('data-test=delete-current-page');
  }
}
