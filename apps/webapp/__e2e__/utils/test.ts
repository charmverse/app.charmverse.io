import { test as base } from '@playwright/test';
import { GlobalPage } from '__e2e__/po/global.po';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';
import { RewardPage } from '__e2e__/po/rewardPage.po';

import { BountyBoardPage } from '../po/bountyBoard.po';
import { DocumentPage } from '../po/document.po';
import { overrideCDNRequests } from '../testWithFixtures';

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
    await overrideCDNRequests(page);

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
