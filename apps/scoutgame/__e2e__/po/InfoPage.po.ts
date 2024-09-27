import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class InfoPage extends GeneralPageLayout {
  constructor(protected page: Page, public container = page.locator('data-test=info-page')) {
    super(page);
  }
}
