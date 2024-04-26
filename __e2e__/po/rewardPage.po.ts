// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
import { getChainById } from 'connectors/chains';

import { baseUrl } from 'testing/mockApiCall';

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

  rootSelector: { locator: Locator['locator'] };

  constructor(page: Page, rootSelector?: string) {
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
  }

  async openApplication({ spaceDomain, applicationId }: { spaceDomain: string; applicationId: string }) {
    await this.page.goto(`${baseUrl}/${spaceDomain}/rewards/applications/${applicationId}`);
  }

  async selectRewardChain(chainId: number) {
    await this.rewardPropertyChain.fill(getChainById(chainId)?.chainName as string);
    await this.page.keyboard.press('Enter');
  }

  // async selectRewardToken(chainId: number) {
  //   await this.rewardPropertyToken.locator(`data-test=select-crypto-${token}`).click();
  // }
}
