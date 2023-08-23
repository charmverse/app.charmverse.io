import type { Page } from '@playwright/test';

import { DocumentPage } from './document.po';

export class ProposalPage extends DocumentPage {
  constructor(
    page: Page,
    public saveDraftButton = page.locator('data-test=create-proposal-button'),
    public categorySelect = page.locator('data-test=proposal-category-select')
  ) {
    super(page);
  }

  getCategoryOption(categoryId: string) {
    return this.page.locator(`data-test=select-option-${categoryId}`);
  }

  gotoNextStatus() {
    return this.page.click('data-test=next-status-button');
  }
}
