// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

// capture actions on the pages in signup flow
export class AcceptInvitePage {
  readonly page: Page;

  readonly acceptInviteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.acceptInviteButton = page.locator('data-test=accept-invite-button');
  }

  async waitForWorkspaceLoaded({ domain }: { domain: string }) {
    await this.page.waitForURL(`**/${domain}/**`);
  }

  async goto() {
    if (baseUrl) {
      await this.page.goto(baseUrl);
    }
  }
}
