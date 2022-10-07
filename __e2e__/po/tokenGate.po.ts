// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

// capture actions on the pages in signup flow
export class TokenGatePage {

  readonly page: Page;

  readonly tokenGateEmptyState: Locator;

  constructor (page: Page) {
    this.page = page;
    this.tokenGateEmptyState = page.locator('data-test=token-gate-empty-state');
  }

  async waitForURL () {
    await this.page.waitForURL('**/join');
  }

  async isEmptyStateVisible () {
    return this.tokenGateEmptyState.isVisible();
  }
}
