import { test as base } from '@playwright/test';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';

import { BountyBoardPage } from '../po/bountyBoard.po';
import { DocumentPage } from '../po/document.po';

type Fixtures = {
  bountyBoardPage: BountyBoardPage;
  documentPage: DocumentPage;
  proposalListPage: ProposalsListPage;
  proposalPage: ProposalPage;
};

export const test = base.extend<Fixtures>({
  bountyBoardPage: ({ page }, use) => use(new BountyBoardPage(page)),
  documentPage: ({ page }, use) => use(new DocumentPage(page)),
  proposalListPage: ({ page }, use) => use(new ProposalsListPage(page)),
  proposalPage: ({ page }, use) => use(new ProposalPage(page))
});

export { chromium, expect } from '@playwright/test';
