import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class ClaimPage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public claimPointsButton = page.locator('data-test=claim-points-button'),
    public successModal = page.locator('data-test=claim-points-success-modal'),
    public headerPointsBalance = page.locator('data-test=user-points-balance')
  ) {
    super(page);
  }
}
