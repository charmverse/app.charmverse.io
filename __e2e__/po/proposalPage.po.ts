import type { Page } from '@playwright/test';

import { DocumentPage } from './document.po';

export class ProposalPage extends DocumentPage {
  constructor(
    page: Page,
    public saveDraftButton = page.locator('data-test=create-proposal-button'),
    public categorySelect = page.locator('data-test=proposal-category-select'),
    public reviewerSelect = page.locator('data-test=proposal-reviewer-select'),
    public nextStatusButton = page.locator('data-test=next-status-button'),
    public createVoteButton = page.locator('data-test=create-vote-button'),
    public voteContainer = page.locator('data-test=vote-container')
  ) {
    super(page);
  }

  getSelectOption(categoryId: string) {
    return this.page.locator(`data-test=select-option-${categoryId}`);
  }
}
