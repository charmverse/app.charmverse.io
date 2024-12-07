import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class QuestsPage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public container = page.locator('data-test=quest-page'),
    public dailyClaimEnabled = page.locator('data-test=daily-claim-enabled'),
    public dailyClaimDisabled = page.locator('data-test=daily-claim-disabled'),
    public claimedIcon = page.locator('data-test=claimed-icon'),
    public sidebar = page.locator('data-test=quest-sidebar'),
    public friendlyQuest = page.locator('data-test=quest-sidebar >> data-test=friendly-quest'),
    public copyReferralButton = friendlyQuest.locator('data-test=copy-referral-link')
  ) {
    super(page);
  }
}
