// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

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

  readonly signInButton: Locator;

  readonly verifyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tokenGateEmptyState = page.locator('data-test=token-gate-empty-state');
    this.connectWalletButton = page.locator('data-test=connect-wallet-button');
    this.tokenGateForm = page.locator('data-test=token-gate-form');
    this.verifyWalletButton = page.locator('data-test=verify-wallet-button');
    this.joinWorkspaceButton = page.locator('data-test=join-space-button');
    this.tokenGateFailureState = page.locator('data-test=token-gate-failure-alert');
    this.joinWorkspaceTextField = page.locator('[data-test=join-workspace-textfield] input');
    this.signInButton = page.locator('data-test=signin-button');
    this.verifyButton = page.locator('data-test=verify-token-gate-btn');
  }

  async goToWorkspaceUrl({ domain }: { domain: string }) {
    await this.page.goto(`${baseUrl ? `${baseUrl}/` : '/'}join?domain=${domain}`);
  }

  async waitForWorkspaceURL({ domain }: { domain: string }) {
    await this.page.waitForURL(`**/join?domain=${domain}**`, { timeout: 0 });
  }

  async waitForJoinURL() {
    await this.page.waitForURL('**/join', { timeout: 0 });
  }
}
