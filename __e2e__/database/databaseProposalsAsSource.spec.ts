import type { User } from '@charmverse/core/prisma';
import type { Proposal, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import { baseUrl } from '@root/config/constants';
import { DatabasePage } from '__e2e__/po/databasePage.po';
import { DocumentPage } from '__e2e__/po/document.po';
import { PagesSidebarPage } from '__e2e__/po/pagesSidebar.po';

import { loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  pagesSidebar: PagesSidebarPage;
  document: DocumentPage;
  databasePage: DatabasePage;
};

const test = base.extend<Fixtures>({
  pagesSidebar: ({ page }, use) => use(new PagesSidebarPage(page)),
  document: ({ page }, use) => use(new DocumentPage(page)),
  databasePage: ({ page }, use) => use(new DatabasePage(page))
});

// Will be set by the first test
let spaceUser: User;
let space: Space;

let firstProposal: Proposal;
let secondProposal: Proposal;
let thirdProposal: Proposal;
let draftProposal: Proposal;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;

  firstProposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: spaceUser.id,
    proposalStatus: 'published'
  });

  secondProposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: spaceUser.id,
    proposalStatus: 'published'
  });

  thirdProposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: spaceUser.id,
    proposalStatus: 'published'
  });

  draftProposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: spaceUser.id,
    proposalStatus: 'draft'
  });
});

test.describe('Database with proposals as datasource', async () => {
  test('create a database with proposals as source', async ({ page, pagesSidebar, databasePage }) => {
    // Arrange ------------------
    await loginBrowserUser({
      browserPage: page,
      userId: spaceUser.id
    });

    await pagesSidebar.goToHomePage(space.domain);

    // Add the database page from the sidebar
    await expect(pagesSidebar.pagesSidebar).toBeVisible();

    await pagesSidebar.pagesSidebar.hover();

    await pagesSidebar.pagesSidebarAddPageButton.click();

    await expect(pagesSidebar.pagesSidebarSelectAddDatabaseButton).toBeVisible();

    await pagesSidebar.pagesSidebarSelectAddDatabaseButton.click();

    await pagesSidebar.databasePage.waitFor({
      state: 'visible'
    });

    // Initialise the new database
    await expect(databasePage.selectProposalsAsSource()).toBeVisible();
    await databasePage.selectProposalsAsSource().click();
    await databasePage.page.locator('data-test=apply-proposal-source-properties').click();

    await databasePage.page.waitForResponse(/api\/pages\/.{1,}\/proposal-source/);

    await databasePage.page.waitForTimeout(500);

    // Wait until the database is initialised

    const syncedCards = await prisma.page.findMany({
      where: {
        syncWithPageId: {
          not: null
        },
        spaceId: space.id
      },
      select: {
        id: true,
        syncWithPageId: true,
        parentId: true
      }
    });
    // Regression check to make sure we did not create duplicate cards
    expect(syncedCards.length).toBe(3);

    const allTargetProposalIds = [firstProposal.id, secondProposal.id, thirdProposal.id];

    // We should only create cards for none draft proposals
    expect(syncedCards.map((c) => c.syncWithPageId)).toEqual(expect.arrayContaining(allTargetProposalIds));

    for (const card of syncedCards) {
      const row = databasePage.getTableRowByCardId({ cardId: card.id });

      await expect(row).toBeVisible();

      const proposalStatusBadge = databasePage.page
        .locator(`data-test=database-row-${card.id}`)
        .filter({ hasText: 'Draft' });

      expect(proposalStatusBadge).toBeVisible();

      const syncedProposalUrl = databasePage.getTablePropertyProposalUrlLocator({ cardId: card.id });
      const proposalPage = await prisma.page.findUniqueOrThrow({
        where: {
          id: card.syncWithPageId as string
        },
        select: {
          path: true
        }
      });

      expect(await syncedProposalUrl.getAttribute('href')).toEqual(`${baseUrl}/${space.domain}/${proposalPage.path}`);
    }

    // Make sure the UI only displays 3 cards
    const firstRow = databasePage.getTableRowByIndex({ index: 0 });
    const secondRow = databasePage.getTableRowByIndex({ index: 1 });
    const thirdRow = databasePage.getTableRowByIndex({ index: 2 });

    await expect(firstRow).toBeVisible();
    await expect(secondRow).toBeVisible();
    await expect(thirdRow).toBeVisible();
    await expect(databasePage.getTableRowByIndex({ index: 3 })).not.toBeVisible();
  });
});
