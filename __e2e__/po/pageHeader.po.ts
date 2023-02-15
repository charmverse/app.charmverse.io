// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

// capture actions on the pages in signup flow
export class PageHeader {
  readonly page: Page;

  readonly pageTopLevelMenu: Locator;

  readonly forumPostActions: Locator;

  readonly pageActionsMenu: Locator;

  readonly deleteCurrentPage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTopLevelMenu = this.page.locator('data-test=header--show-page-actions');
    this.forumPostActions = this.page.locator('data-test=header--forum-post-actions');
    this.pageActionsMenu = this.page.locator('data-test=header--page-actions');
    this.deleteCurrentPage = this.page.locator('data-test=header--delete-current-page');
  }
}
