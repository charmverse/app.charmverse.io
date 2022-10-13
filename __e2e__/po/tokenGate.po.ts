// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

// capture actions on the pages in signup flow
export class TokenGatePage {

  readonly page: Page;

  readonly tokenGateEmptyState: Locator;

  readonly tokenGateFailureState: Locator;

  readonly connectWalletButton: Locator;

  readonly tokenGateForm: Locator;

  readonly verifyWalletButton: Locator;

  readonly joinWorkspaceButton: Locator;

  readonly joinWorkspaceTextField: Locator;

  constructor (page: Page) {
    this.page = page;
    this.tokenGateEmptyState = page.locator('data-test=token-gate-empty-state');
    this.connectWalletButton = page.locator('data-test=connect-wallet-button');
    this.tokenGateForm = page.locator('data-test=token-gate-form');
    this.verifyWalletButton = page.locator('data-test=verify-wallet-button');
    this.joinWorkspaceButton = page.locator('text=Join workspace');
    this.tokenGateFailureState = page.locator('data-test=token-gate-failure-alert');
    this.joinWorkspaceTextField = page.locator('[data-test=join-workspace-textfield] input');
  }

  async waitForWorkspaceURL ({ domain, returnUrl }: { domain: string, returnUrl: string }) {
    await this.page.waitForURL(`**/join?domain=${domain}&returnUrl=${encodeURIComponent(returnUrl)}`, { timeout: 0 });
  }

  async waitForJoinURL () {
    await this.page.waitForURL('**/join', { timeout: 0 });
  }
}
