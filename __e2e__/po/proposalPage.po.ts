import type { ProposalEvaluationType, ProposalSystemRole } from '@charmverse/core/prisma-client';
import type { Page } from '@playwright/test';

import { DocumentPage } from './document.po';

export class ProposalPage extends DocumentPage {
  constructor(
    page: Page,
    public saveDraftButton = page.locator('data-test=create-proposal-button'),
    public categorySelect = page.locator('data-test=proposal-category-select'),
    public reviewerSelect = page.locator('data-test=proposal-reviewer-select'),
    public nextStatusButton = page.locator('data-test=next-status-button'),
    public confirmStatusButton = page.locator('data-test=modal-confirm-button'),
    public createVoteButton = page.locator('data-test=create-vote-button'),
    public voteContainer = page.locator('data-test=vote-container'),
    public currentStatus = page.locator('data-test=current-proposal-status'),
    public workflowSelect = page.locator('data-test=proposal-workflow-select'),
    public voterSelect = page.locator('data-test=proposal-vote-select'),
    public completeDraftButton = page.locator('data-test=complete-draft-button'),
    public evaluationSettingsSidebar = page.locator('data-test=evaluation-settings-sidebar'),
    public addRubricCriteriaButton = page.locator('data-test=add-rubric-criteria-button'),
    public editRubricCriteriaLabel = page.locator('data-test=edit-rubric-criteria-label >> textarea').first(),
    public editRubricCriteriaDescription = page
      .locator('data-test=edit-rubric-criteria-description >> textarea')
      .first(),
    public editRubricCriteriaMinScore = page.locator('data-test=edit-rubric-criteria-min-score >> input'),
    public editRubricCriteriaMaxScore = page.locator('data-test=edit-rubric-criteria-max-score >> input'),
    public evaluationVoteDurationInput = page
      .locator('data-test=evaluation-vote-settings')
      .locator('data-test=vote-duration')
      .locator('data-test=numeric-field >> input'),
    public evaluationVotePassThresholdInput = page
      .locator('data-test=evaluation-vote-settings')
      .locator('data-test=vote-pass-threshold')
      .locator('data-test=numeric-field >> input'),
    public pageTopLevelMenu = page.locator('data-test=header--show-page-actions'),
    public archiveProposalAction = page.locator('data-test=header--archive-current-proposal'),
    public moveFromFeedbackEvaluation = page.locator('data-test=move-from-feedback-evaluation')
  ) {
    super(page);
  }

  getSelectOption(optionId: string) {
    return this.page.locator(`data-test=select-option-${optionId}`);
  }

  async waitForNewProposalPage(domain: string) {
    return this.page.waitForURL(`**/${domain}/proposals/new?**`);
  }

  async selectWorkflow(workflowId: string) {
    await this.workflowSelect.click();
    await this.getSelectOption(workflowId).click();
  }

  getEvaluationReviewerSelect(evaluationType: ProposalEvaluationType) {
    return this.page.locator(`data-test=proposal-${evaluationType}-select`);
  }

  /**
   * @param assignee Either a system role, or a user or role id
   */
  async selectEvaluationReviewer(evaluationType: ProposalEvaluationType, assignee: ProposalSystemRole | string) {
    await this.getEvaluationReviewerSelect(evaluationType).click();
    await this.getSelectOption(assignee).click();
    // Close the menu afterwards
    await this.getEvaluationReviewerSelect(evaluationType).click();
    await this.page.keyboard.press('Escape');
  }

  async toggleArchiveProposal() {
    await this.pageTopLevelMenu.click();
    await this.archiveProposalAction.click();
    // Press escape to close the menu
    await this.page.keyboard.press('Escape');
  }
}
