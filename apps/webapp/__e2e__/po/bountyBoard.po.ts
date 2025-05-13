// playwright-dev-page.ts
import type { Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

import { GlobalPage } from './global.po';
// capture actions on the pages in signup flow
export class BountyBoardPage extends GlobalPage {
  constructor(
    public page: Page,
    public createBountyButton = page.locator('data-test=create-suggest-bounty'),
    public publicLayout = page.locator('data-test=public-page-layout'),
    public loggedInLayout = page.locator('data-test=space-page-layout'),
    public allBountiesLayout = page.locator('data-test=all-bounties-layout')
  ) {
    super(page);
  }

  async goToBountyBoard(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}/bounties`);
  }

  async goToBountyBoardWithCard(domain: string, cardId: string) {
    await this.page.goto(`${baseUrl}/${domain}/bounties?bountyId=${cardId}`);
  }

  async goToView(type: 'all' | 'open') {
    await this.page.locator(`data-test=bounties-view-${type}`).click();
  }

  getBountyCardLocator(bountyId: string) {
    return this.page.locator(`data-test=bounty-card-${bountyId}`);
  }

  waitForModal() {
    return this.page.waitForSelector('data-test=dialog');
  }
}
