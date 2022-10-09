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

  async waitForWorkspaceURL ({ domain, returnUrl }: { domain: string, returnUrl: string }) {
    await this.page.waitForURL(`**/join?domain=${domain}&returnUrl=${encodeURIComponent(returnUrl)}`, { timeout: 0 });
  }
}
