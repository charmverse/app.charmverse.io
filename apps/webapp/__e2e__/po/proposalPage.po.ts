import type { ProposalEvaluationType, ProposalSystemRole } from '@charmverse/core/prisma-client';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { DocumentPage } from './document.po';

export class ProposalPage extends DocumentPage {
  constructor(
    page: Page,
    public publishNewProposalButton = page.locator('data-test=publish-proposal-button'),
    public categorySelect = page.locator('data-test=proposal-category-select'),
    public reviewerSelect = page.locator('data-test=proposal-reviewer-select'),
    public nextStatusButton = page.locator('data-test=next-status-button'),
    public confirmStatusButton = page.locator('data-test=modal-confirm-button'),
    public createVoteButton = page.locator('data-test=create-vote-button'),
    public voteContainer = page.locator('data-test=vote-container'),
    public currentStatus = page.locator('data-test=current-proposal-status'),
    public projectTeamMembersSelect = page.locator('data-test=project-team-members-select'),
    public templateSelect = page.locator('data-test=proposal-template-select'),
    public workflowSelect = page.locator('data-test=workflow-select'),
    public voterSelect = page.locator('data-test=proposal-vote-select'),
    public evaluationSettingsSidebar = page.locator('data-test=evaluation-settings-sidebar'),
    public addRubricCriteriaButton = page.locator('data-test=add-rubric-criteria-button'),
    // Simple utility for editing the first rubric criteria
    public editRubricCriteriaLabel = page.locator('data-test=edit-rubric-criteria-label >> textarea').first(),
    public editRubricCriteriaDescription = page
      .locator('data-test=edit-rubric-criteria-description >> textarea')
      .first(),
    public editRubricCriteriaMinScore = page.locator('data-test=edit-rubric-criteria-min-score >> input').first(),
    public editRubricCriteriaMaxScore = page.locator('data-test=edit-rubric-criteria-max-score >> input').first(),
    // Edit additional criteria
    public editNthRubricCriteriaLabel = (index: number) =>
      page.locator('data-test=edit-rubric-criteria-label >> textarea').nth(index),
    public editNthRubricCriteriaDescription = (index: number) =>
      page.locator('data-test=edit-rubric-criteria-description >> textarea').nth(index),
    public editNthRubricCriteriaMinScore = (index: number) =>
      page.locator('data-test=edit-rubric-criteria-min-score >> input').nth(index),
    public editNthRubricCriteriaMaxScore = (index: number) =>
      page.locator('data-test=edit-rubric-criteria-max-score >> input').nth(index),
    public evaluationVoteDurationInput = page
      .locator('data-test=evaluation-vote-settings')
      .locator('data-test=vote-duration')
      .locator('data-test=numeric-field >> input'),
    public evaluationVotePassThresholdInput = page
      .locator('data-test=evaluation-vote-settings')
      .locator('data-test=vote-pass-threshold')
      .locator('data-test=numeric-field >> input'),
    public evaluationVoteTypeApproval = page
      .locator('data-test=evaluation-vote-settings')
      .locator('data-test=vote-type-approval'),
    public evaluationVoteSettings = page.locator('data-test=evaluation-vote-settings'),
    public evaluationVoteTypeCustomOptions = page
      .locator('data-test=evaluation-vote-settings')
      .locator('data-test=vote-type-custom-options'),
    public voteOption = (index: number) =>
      page
        .locator('data-test=evaluation-vote-settings')
        .locator('data-test=inline-vote-option')
        .nth(index)
        .locator('input'),
    public addVoteOption = page.locator('data-test=evaluation-vote-settings').locator('data-test=add-vote-option'),
    public deleteVoteOption = (index: number) =>
      page.locator('data-test=evaluation-vote-settings').locator('data-test=delete-vote-option').nth(index),
    public pageTopLevelMenu = page.locator('data-test=header--show-page-actions'),
    public archiveProposalAction = page.locator('data-test=header--archive-current-proposal'),
    public addReward = page.locator('data-test=add-reward'),
    public passFeedbackEvaluation = page.locator('data-test=pass-feedback-evaluation'),
    public failEvaluationButton = page.locator('data-test=evaluation-fail-button'),
    public passEvaluationButton = page.locator('data-test=evaluation-pass-button'),
    public rubricStepDecisionTab = page.locator('data-test=Decision-tab'),
    public goBackButton = page.locator('data-test=evaluation-go-back-button'),
    public rubricCriteriaScore = page.locator('data-test=rubric-criteria-score-input >> input'),
    public rubricCriteriaComment = page.locator('data-test=rubric-criteria-score-comment >> textarea').first(),
    public saveRubricAnswers = page.locator('data-test=save-rubric-answers'),
    public selectApprover = page.locator('data-test=proposal-rubric-approver-select')
  ) {
    super(page);
  }

  getRemoveProjectMemberButton(index: number) {
    return this.page.locator(`data-test=remove-project-member-button`).nth(index);
  }

  getProjectMemberOption(index: number) {
    return this.page.locator('data-test=project-member-option').nth(index);
  }

  getSelectOption(optionId: string) {
    return this.page.locator(`data-test=select-option-${optionId}`);
  }

  async waitForNewProposalPage() {
    return expect(this.documentTitleInput).toBeVisible();
  }

  async selectWorkflow(workflowId: string) {
    await this.workflowSelect.click();
    await this.getSelectOption(workflowId).click();
  }

  getEvaluationReviewerSelect(evaluationType: ProposalEvaluationType) {
    return this.page.locator(`data-test=proposal-${evaluationType}-select`);
  }

  async getSelectedReviewers() {
    return this.page.locator('data-test=selected-user-or-role-option');
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

  getVoteOption(optionName: string) {
    return this.page.locator(`data-test=current-vote-${optionName} >> input`);
  }
}
