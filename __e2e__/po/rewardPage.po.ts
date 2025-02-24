// playwright-dev-page.ts
import { getChainById } from '@packages/blockchain/connectors/chains';
import { baseUrl } from '@packages/testing/mockApiCall';
import type { Locator, Page } from '@playwright/test';

import { GlobalPage } from './global.po';

// capture actions on the pages in signup flow
export class RewardPage extends GlobalPage {
  readonly rewardApplicationPage: Locator;

  readonly rewardApplicationPageStatusChip: Locator;

  readonly rewardApplicationApproveButton: Locator;

  readonly rewardApplicationRejectButton: Locator;

  readonly confirmApproveApplicationButton: Locator;

  readonly confirmRejectApplicationButton: Locator;

  readonly cancelReviewDecisionButton: Locator;

  readonly rewardPropertyChain: Locator;

  readonly rewardPropertyToken: Locator;

  readonly rewardPropertyAmount: Locator;

  readonly rewardValueConfiguration: Locator;

  readonly saveRewardValue: Locator;

  readonly openRewardValueDialog: Locator;

  readonly addCustomToken: Locator;

  readonly customTokenFormContainer: Locator;

  readonly customTokenContractAddressInput: Locator;

  readonly saveTokenPaymentMethod: Locator;

  readonly customTokenLogoUrl: Locator;

  readonly customTokenDecimals: Locator;

  readonly customTokenSymbol: Locator;

  readonly customTokenName: Locator;

  readonly rewardTemplateSelect: Locator;

  readonly addNewTemplate: Locator;

  readonly documentTitleInput: Locator;

  readonly draftRewardButton: Locator;

  readonly workflowSelect: Locator;

  readonly rewardReviewerSelect: Locator;

  readonly publishRewardButton: Locator;

  readonly newWorkButton: Locator;

  readonly createBountyButton: Locator;

  readonly applicationInput: Locator;

  readonly submissionInput: Locator;

  readonly submitApplicationButton: Locator;

  readonly submitSubmissionButton: Locator;

  readonly markPaidButton: Locator;

  readonly confirmMarkPaidButton: Locator;

  rootSelector: { locator: Locator['locator'] };

  constructor(
    page: Page,
    rootSelector?: string,
    public rewardTypeSelect = page.locator('data-test=reward-type-select'),
    public customRewardInput = page.locator('data-test=custom-reward-input >> input')
  ) {
    super(page);
    this.rootSelector = rootSelector ? this.page.locator(rootSelector) : this.page;
    this.rewardApplicationApproveButton = this.rootSelector.locator('data-test=approve-reward-button');
    this.rewardApplicationRejectButton = this.rootSelector.locator('data-test=reject-reward-button');
    this.confirmApproveApplicationButton = this.rootSelector.locator('data-test=confirm-approve-application-button');
    this.confirmRejectApplicationButton = this.rootSelector.locator('data-test=confirm-reject-application-button');
    this.cancelReviewDecisionButton = this.rootSelector.locator('data-test=cancel-review-decision-button');
    this.rewardApplicationPage = this.rootSelector.locator('data-test=reward-application-page');
    this.rewardApplicationPageStatusChip = this.rewardApplicationPage.locator(
      'data-test=reward-application-status-chip'
    );
    this.openRewardValueDialog = this.rootSelector.locator('data-test=open-reward-value-dialog');

    this.rewardValueConfiguration = this.page.locator('data-test=reward-value-configuration');

    this.rewardPropertyChain = this.rewardValueConfiguration.locator('data-test=chain-options >> input');
    this.rewardPropertyAmount = this.rewardValueConfiguration.locator('data-test=reward-property-amount >> input');
    this.rewardPropertyToken = this.rewardValueConfiguration.locator('data-test=token-list >> input');
    this.saveRewardValue = this.rewardValueConfiguration.locator('data-test=save-reward-value');

    this.addCustomToken = this.page.locator('data-test=add-custom-token');
    this.customTokenFormContainer = this.page.locator('data-test=custom-token-modal');
    this.customTokenContractAddressInput = this.customTokenFormContainer.locator(
      'data-test=custom-token-contract-address >> input'
    );
    this.customTokenLogoUrl = this.customTokenFormContainer.locator('data-test=custom-token-logo-url >> input');
    this.customTokenDecimals = this.customTokenFormContainer.locator('data-test=custom-token-decimals >> input');
    this.customTokenSymbol = this.customTokenFormContainer.locator('data-test=custom-token-symbol >> input');
    this.customTokenName = this.customTokenFormContainer.locator('data-test=custom-token-name >> input');
    this.saveTokenPaymentMethod = this.customTokenFormContainer.locator('data-test=create-token-payment-method');
    this.rewardTemplateSelect = this.page.locator('data-test=reward-template-select');
    this.addNewTemplate = this.page.locator('data-test=new-template-button');
    this.documentTitleInput = this.rootSelector.locator(`data-test=editor-page-title >> textarea`).first();
    this.draftRewardButton = this.rootSelector.locator('data-test=draft-reward-button');
    this.workflowSelect = this.rootSelector.locator('data-test=workflow-select');
    this.rewardReviewerSelect = this.rootSelector.locator('data-test=reward-reviewer-select');
    this.publishRewardButton = this.rootSelector.locator('data-test=publish-reward-button');
    this.newWorkButton = this.rootSelector.locator('data-test=new-work-button');
    this.applicationInput = this.rootSelector.locator('data-test=application-input >> div[contenteditable]').first();
    this.submissionInput = this.rootSelector.locator('data-test=submission-input >> div[contenteditable]').first();
    this.submitApplicationButton = this.rootSelector.locator('data-test=submit-application-button');
    this.submitSubmissionButton = this.rootSelector.locator('data-test=submit-submission-button');
    this.markPaidButton = this.rootSelector.locator('data-test=mark-paid-button');
    this.confirmMarkPaidButton = this.rootSelector.locator('data-test=confirm-mark-paid-button');
    this.createBountyButton = page.locator('data-test=create-suggest-bounty');
  }

  async gotoRewardPage({ spaceDomain }: { spaceDomain: string }) {
    await this.page.goto(`${baseUrl}/${spaceDomain}/rewards`);
  }

  async openApplication({ spaceDomain, applicationId }: { spaceDomain: string; applicationId: string }) {
    await this.page.goto(`${baseUrl}/${spaceDomain}/rewards/applications/${applicationId}`);
  }

  async selectRewardChain(chainId: number) {
    await this.rewardPropertyChain.fill(getChainById(chainId)?.chainName as string);
    await this.page.keyboard.press('Enter');
  }

  async selectRewardType(rewardType: string) {
    await this.rewardTypeSelect.click();
    await this.getSelectOption(rewardType).click();
  }

  async selectRewardReviewer(optionId: string) {
    await this.rewardReviewerSelect.click();
    await this.getSelectOption(optionId).click();
  }

  async selectRewardTemplate(optionId: string) {
    await this.rewardTemplateSelect.click();
    await this.getSelectOption(optionId).click();
  }

  async writeApplicationInput(text: string) {
    await this.applicationInput.fill(text);
  }

  async writeSubmissionInput(text: string) {
    await this.submissionInput.fill(text);
  }

  async writeCustomRewardInput(text: string) {
    await this.customRewardInput.fill(text);
  }

  getSelectOption(optionId: string) {
    return this.page.locator(`data-test=select-option-${optionId}`);
  }
}
