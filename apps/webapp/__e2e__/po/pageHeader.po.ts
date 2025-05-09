// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

// capture actions on the pages in signup flow
export class PageHeader {
  readonly page: Page;

  readonly pageTopLevelMenu: Locator;

  readonly forumPostActions: Locator;

  readonly pageActionsMenu: Locator;

  readonly deleteCurrentPage: Locator;

  readonly toggleCurrentPageLock: Locator;

  readonly convertProposalAction: Locator;

  // public rootSelector: { locator: Locator['locator'] };

  constructor(page: Page, rootSelector?: string) {
    this.page = page;
    // this.rootSelector = rootSelector ? this.page.locator(rootSelector) : this.page;
    this.pageTopLevelMenu = this.page.locator('data-test=header--show-page-actions');
    this.forumPostActions = this.page.locator('data-test=header--forum-post-actions');
    this.pageActionsMenu = this.page.locator('data-test=header--page-actions');
    this.deleteCurrentPage = this.page.locator('data-test=header--delete-current-page');
    this.toggleCurrentPageLock = this.page.locator('data-test=header--toggle-current-page-lock');
    this.convertProposalAction = this.page.locator('data-test=convert-proposal-action');
  }

  async convertToProposal() {
    await this.pageTopLevelMenu.click();
    await this.convertProposalAction.click();
  }
}
