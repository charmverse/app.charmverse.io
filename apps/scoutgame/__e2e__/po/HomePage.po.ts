import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class HomePage extends GeneralPageLayout {
  constructor(protected page: Page, public container = page.locator('data-test=home-page')) {
    super(page);
  }
}
