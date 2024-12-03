import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class ScoutPage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public container = page.locator('data-test=scout-page'),
    public optimismPromoCard = page.locator('data-test=promo-card-optimism'),
    public moxiePromoCard = page.locator('data-test=promo-card-moxie')
  ) {
    super(page);
  }
}
