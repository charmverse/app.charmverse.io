import type { Page, Locator } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { GlobalPage } from './global.po';

export class ProposalsListPage extends GlobalPage {
  constructor(
    page: Page,
    public emptyState = page.locator('data-test=empty-state'),
    public proposalTemplateSelect = page.locator('data-test=proposal-template-select'),
    public createProposalButton = page.locator('data-test=new-proposal-button')
  ) {
    super(page);
  }

  goToProposals(domain: string) {
    return this.page.goto(`${baseUrl}/${domain}/proposals`);
  }

  waitForProposalsList() {
    return this.page.waitForURL(/\/proposals$/);
  }

  getProposalRowLocator(proposalId: string): Locator {
    return this.page.locator(`data-test=database-row-${proposalId}`);
  }

  getProposalRowOpenLocator(proposalId: string): Locator {
    return this.page.locator(`data-test=database-row-open-${proposalId}`);
  }

  getProposalCategoryLocator(categoryId: string) {
    return this.page.locator(`data-test=proposal-category-${categoryId}`);
  }

  getProposalCategoryListButtonLocator() {
    return this.page.locator('data-test=proposal-view-options-desktop').locator(`data-test=proposal-category-list`);
  }

  getTemplateOptionLocator(pageId: string) {
    return this.page.locator(`data-test=select-option-${pageId}`);
  }

  async openProposalCard(proposalId: string) {
    await this.getProposalRowLocator(proposalId).hover();
    await this.getProposalRowOpenLocator(proposalId).click();
  }
}
