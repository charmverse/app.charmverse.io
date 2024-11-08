import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class InfoPage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public container = page.locator('data-test=info-page'),
    public termsContainer = page.locator('data-test=terms-page'),
    public privacyContainer = page.locator('data-test=privacy-page'),
    public dpaContainer = page.locator('data-test=dpa-page'),
    public moxieContainer = page.locator('data-test=partner-moxie-page'),
    public optimismContainer = page.locator('data-test=partner-optimism-page')
  ) {
    super(page);
  }
}
