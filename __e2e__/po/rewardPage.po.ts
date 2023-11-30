// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

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

  constructor(page: Page) {
    super(page);
    this.rewardApplicationApproveButton = page.locator('data-test=approve-reward-button');
    this.rewardApplicationRejectButton = page.locator('data-test=reject-reward-button');
    this.confirmApproveApplicationButton = page.locator('data-test=confirm-approve-application-button');
    this.confirmRejectApplicationButton = page.locator('data-test=confirm-reject-application-button');
    this.cancelReviewDecisionButton = page.locator('data-test=cancel-review-decision-button');
    this.rewardApplicationPage = page.locator('data-test=reward-application-page');
    this.rewardApplicationPageStatusChip = this.rewardApplicationPage.locator(
      'data-test=reward-application-status-chip'
    );
  }

  async openApplication({
    rewardPagePath,
    spaceDomain,
    applicationId
  }: {
    rewardPagePath: string;
    spaceDomain: string;
    applicationId: string;
  }) {
    await this.page.goto(`${baseUrl}/${spaceDomain}/${rewardPagePath}?applicationId=${applicationId}`);
  }
}
