import type { Locator } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { GlobalPage } from './global.po';

export class ProposalsListPage extends GlobalPage {
  goToProposals(domain: string) {
    return this.page.goto(`${baseUrl}/${domain}/proposals`);
  }

  waitForProposalsList() {
    return this.page.waitForURL(/\/proposals^/);
  }

  clickNewProposalDialog() {
    return this.page.click('data-test=new-proposal-button');
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

  getEmptyStateLocator() {
    return this.page.locator('data-test=empty-state');
  }
}
