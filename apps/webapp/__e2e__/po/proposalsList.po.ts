import type { Page, Locator } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

import { GlobalPage } from './global.po';

export class ProposalsListPage extends GlobalPage {
  constructor(
    page: Page,
    public emptyState = page.locator('data-test=empty-state'),
    public proposalTemplateSelect = page.locator('data-test=proposal-template-select'),
    public addNewTemplate = page.locator('data-test=new-template-button'),
    public templateContextMenu = page.locator('data-test=template-context-menu'),
    public duplicateTemplateButton = page.locator('data-test=duplicate-template-button'),
    public createProposalButton = page.locator('data-test=new-proposal-button'),
    public proposalTemplateFreeFormOption = page.locator('data-test=free_form-proposal-template-menu'),
    public structuredProposalTemplateMenu = page.locator('data-test=structured-proposal-template-menu')
  ) {
    super(page);
  }

  async goToProposals(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}/proposals?viewId=all`);
  }

  goToNewProposalForm(domain: string, queryString: string = '') {
    return this.page.goto(`${baseUrl}/${domain}/proposals/new${queryString}`);
  }

  waitForProposalsList() {
    return this.page.waitForURL(/\/proposals($|\?viewId=all)/);
  }

  getProposalRowLocator(proposalId: string): Locator {
    return this.page.locator(`data-test=database-row-${proposalId}`);
  }

  getProposalRowOpenLocator(proposalId: string): Locator {
    return this.page.locator(`data-test=database-open-button-${proposalId}`);
  }

  getProposalRowReviewersLocators(proposalId: string): Promise<Locator[]> {
    return this.page
      .locator(`data-test=database-row-${proposalId}`)
      .locator(`data-test=selected-reviewers`)
      .locator('data-test=selected-user-or-role-option')
      .all();
  }

  getProposalSidebarButtonLocator() {
    return this.page.locator(`data-test=view-header-actions-menu`);
  }

  getTemplateOptionLocator(pageId: string) {
    return this.page.locator(`data-test=select-option-${pageId}`);
  }

  async openProposalCard(proposalId: string) {
    await this.getProposalRowLocator(proposalId).hover();
    await this.getProposalRowOpenLocator(proposalId).click();
  }
}
