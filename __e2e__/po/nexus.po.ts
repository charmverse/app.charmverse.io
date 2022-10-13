// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

// capture actions on the pages in signup flow
export class NexusPage {

  readonly page: Page;

  readonly logoutButton: Locator;

  constructor (page: Page) {
    this.page = page;
    this.logoutButton = page.locator('data-test=logout-button');
  }

  async waitForURL () {
    await this.page.waitForURL('**/nexus');
  }

  async goto () {
    await this.page.goto(`${baseUrl}/nexus`);
  }
}
