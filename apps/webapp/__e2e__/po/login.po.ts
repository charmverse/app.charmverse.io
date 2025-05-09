// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

// capture actions on the pages in signup flow
export class LoginPage {
  readonly page: Page;

  readonly connectDiscordButton: Locator;

  readonly selectNewWorkspaceButton: Locator;

  readonly universalConnectButton: Locator;

  readonly connectWalletButton: Locator;

  readonly verifyWalletButton: Locator;

  readonly workspaceFormDomainInput: Locator;

  readonly workspaceFormSubmit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.universalConnectButton = page.locator('data-test=universal-connect-button');
    this.connectDiscordButton = page.locator('data-test=connect-discord-button');
    this.connectWalletButton = page.locator('data-test=connect-wallet-button');
    this.verifyWalletButton = page.locator('data-test=verify-wallet-button');
    this.selectNewWorkspaceButton = page.locator('data-test=goto-create-workspace');
    this.workspaceFormDomainInput = page.locator('data-test=workspace-domain-input');
    this.workspaceFormSubmit = page.locator('data-test=create-workspace');
  }

  async goto() {
    // assume that the base page will redirect to /signup
    if (baseUrl) {
      await this.page.goto(baseUrl);
    }
  }

  async waitForURL() {
    await this.page.waitForURL('**/');
  }

  async waitForWorkspaceLoaded({ domain, page }: { domain: string; page: { path: string; title: string } }) {
    await this.page.waitForURL(`**/${domain}/${page.path}`);
    await this.page.locator(`text=${page.title}`).first().waitFor();
  }
}
