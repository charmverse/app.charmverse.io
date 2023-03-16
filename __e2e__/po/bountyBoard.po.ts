// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

// capture actions on the pages in signup flow
export class BountyBoardPage {
  readonly page: Page;

  readonly createBountyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createBountyButton = page.locator('data-test=create-suggest-bounty');
  }

  async goToBountyBoard(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}/bounties`);
  }

  async goToBountyBoardWithCard(domain: string, cardId: string) {
    await this.page.goto(`${baseUrl}/${domain}/bounties?bountyId=${cardId}`);
  }

  getBountyCardLocator(bountyId: string) {
    return this.page.locator(`data-test=bounty-card-${bountyId}`);
  }
}
