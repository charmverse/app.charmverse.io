import type { Locator } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { GlobalPage } from './global.po';

export class ProposalsListPage extends GlobalPage {
  async goToProposals(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}/proposals`);
  }

  async waitForProposalsList(domain: string) {
    await this.page.waitForURL(`${baseUrl}/${domain}/proposals`);
  }

  getProposalRowLocator(proposalId: string): Locator {
    return this.page.locator(`data-test=proposal-row-${proposalId}`);
  }

  getProposalRowOpenLocator(proposalId: string): Locator {
    return this.page.locator(`data-test=open-proposal-${proposalId}`);
  }

  getProposalCategoryLocator(categoryId: string) {
    return this.page.locator(`data-test=proposal-category-${categoryId}`);
  }

  getProposalCategoryListButtonLocator() {
    return this.page.locator('data-test=proposal-view-options-desktop').locator(`data-test=proposal-category-list`);
  }
}
