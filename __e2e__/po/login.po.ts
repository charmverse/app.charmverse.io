// playwright-dev-page.ts
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

// capture actions on the pages in signup flow
export class LoginPage {

  readonly page: Page;

  readonly connectDiscordButton: Locator;

  readonly selectNewWorkspaceButton: Locator;

  readonly verifyWalletButton: Locator;

  readonly workspaceFormDomainInput: Locator;

  readonly workspaceFormSubmit: Locator;

  constructor (page: Page) {
    this.page = page;
    this.connectDiscordButton = page.locator('data-test=connect-discord');
    this.verifyWalletButton = page.locator('data-test=verify-wallet-button');
    this.selectNewWorkspaceButton = page.locator('data-test=goto-create-workspace');
    this.workspaceFormDomainInput = page.locator('data-test=workspace-domain-input');
    this.workspaceFormSubmit = page.locator('data-test=create-workspace');
  }

  async goto () {
    // assume that the base page will redirect to /signup
    await this.page.goto(baseUrl);
  }

  async waitForURL () {
    await this.page.waitForURL('**/');
  }

  // retrieve the Discord URL when clicking 'connect discord' button
  async getDiscordUrl () {
    const discordButtonHref = await this.connectDiscordButton.evaluate(node => (node as HTMLAnchorElement).href);
    expect(discordButtonHref).toBeDefined();
    const redirectResponse = await this.page.request.get(discordButtonHref, { maxRedirects: 0 });
    expect(redirectResponse.status()).toBe(307);
    return redirectResponse.headers().location;
  }

  async gotoDiscordCallback ({ discordApiUrl, discordWebsiteUrl }: { discordApiUrl: string, discordWebsiteUrl: string }) {

    const discordUrl = new URL(discordWebsiteUrl);
    const callbackUrl = discordUrl.searchParams.get('redirect_uri'); // http://127.0.0.1:3335/api/discord/callback
    const state = discordUrl.searchParams.get('state');

    await this.page.goto(`${callbackUrl}?code=123&state=${state}&discordApiUrl=${discordApiUrl}`);
  }

  async waitForWorkspaceLoaded ({ domain, page }: { domain: string, page: { path: string, title: string } }) {
    await this.page.waitForURL(`**/${domain}/${page.path}`);
    await this.page.locator(`text=${page.title}`).first().waitFor();
  }

}
