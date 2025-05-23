import { test as base } from '@playwright/test';
import { GlobalPage } from '__e2e__/po/global.po';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';
import { RewardPage } from '__e2e__/po/rewardPage.po';

import { BountyBoardPage } from '../po/bountyBoard.po';
import { DocumentPage } from '../po/document.po';

type Fixtures = {
  globalPage: GlobalPage;
  bountyBoardPage: BountyBoardPage;
  documentPage: DocumentPage;
  proposalListPage: ProposalsListPage;
  proposalPage: ProposalPage;
  rewardPage: RewardPage;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    // Set up routing for all requests
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.startsWith('https://cdn.charmverse.io/')) {
        const newUrl = url.replace('https://cdn.charmverse.io/', 'http://localhost:3335/');
        // console.log(`Redirecting ${url} to ${newUrl}`);
        await route.fulfill({
          status: 301,
          headers: {
            Location: newUrl
          }
        });
      } else {
        await route.continue();
      }
    });

    // Use the page with the custom routing
    await use(page);
  },
  globalPage: ({ page }, use) => use(new GlobalPage(page)),
  bountyBoardPage: ({ page }, use) => use(new BountyBoardPage(page)),
  documentPage: ({ page }, use) => use(new DocumentPage(page)),
  proposalListPage: ({ page }, use) => use(new ProposalsListPage(page)),
  proposalPage: ({ page }, use) => use(new ProposalPage(page)),
  rewardPage: ({ page }, use) => use(new RewardPage(page))
});

export { chromium, expect } from '@playwright/test';
