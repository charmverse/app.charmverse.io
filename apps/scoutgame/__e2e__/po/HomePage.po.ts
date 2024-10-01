import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class HomePage extends GeneralPageLayout {
  tabs = ['leaderboard', 'top-scouts', 'top-builders', 'activity'];

  constructor(protected page: Page, public container = page.locator('data-test=home-page')) {
    super(page);
  }

  tabView(tab: string) {
    return this.page.locator(`data-test=${tab}-table`);
  }

  async selectTab(tab: string) {
    await this.page.locator(`data-test=tab-${tab}`).click();
  }
}
