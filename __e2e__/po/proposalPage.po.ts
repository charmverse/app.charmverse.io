import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import type { Page } from '@playwright/test';

import { DocumentPage } from './document.po';

export class ProposalPage extends DocumentPage {
  constructor(
    page: Page,
    public saveDraftButton = page.locator('data-test=create-proposal-button'),
    public categorySelect = page.locator('data-test=proposal-category-select'),
    public nextStatusButton = page.locator('data-test=next-status-button'),
    public confirmStatusButton = page.locator('data-test=modal-confirm-button'),
    public createVoteButton = page.locator('data-test=create-vote-button'),
    public voteContainer = page.locator('data-test=vote-container'),
    public currentStatus = page.locator('data-test=current-proposal-status'),
    public workflowSelect = page.locator('data-test=proposal-workflow-select'),
    public voterSelect = page.locator('data-test=proposal-vote-select'),
    public completeDraftButton = page.locator('data-test=complete-draft-button')
  ) {
    super(page);
  }

  getSelectOption(categoryId: string) {
    return this.page.locator(`data-test=select-option-${categoryId}`);
  }

  async waitForNewProposalPage(domain: string) {
    return this.page.waitForURL(`**/${domain}/proposals/new?**`);
  }

  async selectCategory(categoryId: string) {
    await this.categorySelect.click();
    await this.getSelectOption(categoryId).click();
  }

  async selectWorkflow(workflowId: string) {
    await this.workflowSelect.click();
    await this.getSelectOption(workflowId).click();
  }

  async selectEvaluationOption(evaluationType: ProposalEvaluationType, option: string) {
    await this.page.locator(`data-test=proposal-${evaluationType}-select`).click();
    await this.getSelectOption(option).click();
  }
}
