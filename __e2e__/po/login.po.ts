// playwright-dev-page.ts
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

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

  async waitForLogin(discordApiUrl: string) {
    await this.page.route('**/api/discord/oauth', async (route) => {
      await route.fulfill({
        status: 301,
        headers: {
          location: `${discordApiUrl}/api/oauth2/authorize?prompt=consent&client_id=1234&response_type=code`
        }
      });
    });
    await this.page.route('**/api/discord/login', async (route) => {
      const _body = route.request().postData();
      await route.continue({
        postData: JSON.stringify({
          ...(_body ? JSON.parse(_body) : undefined),
          discordApiUrl
        })
      });
    });
  }

  async waitForWorkspaceLoaded({ domain, page }: { domain: string; page: { path: string; title: string } }) {
    await this.page.waitForURL(`**/${domain}/${page.path}`);
    await this.page.locator(`text=${page.title}`).first().waitFor();
  }
}
