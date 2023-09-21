import { test as base } from '@playwright/test';

import { BountyBoardPage } from '../../testing/__e2e__/po/bountyBoard.po';
import { DocumentPage } from '../../testing/__e2e__/po/document.po';

type Fixtures = {
  bountyBoardPage: BountyBoardPage;
  documentPage: DocumentPage;
};

export const test = base.extend<Fixtures>({
  bountyBoardPage: ({ page }, use) => use(new BountyBoardPage(page)),
  documentPage: ({ page }, use) => use(new DocumentPage(page))
});

export { chromium, expect } from '@playwright/test';
