import { testUtilsSpaces } from '@charmverse/core/test';
import { test, expect } from '@playwright/test';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';

import { generateProposal } from 'testing/setupDatabase';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe('Proposal templates', () => {
  // create reusable pages we can reuse between tests
  let proposalListPage: ProposalsListPage;
  let proposalPage: ProposalPage;

  let userId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    proposalListPage = new ProposalsListPage(page);
    proposalPage = new ProposalPage(page);
  });

  test('A user can create a proposal from a template', async () => {
    // Initial setup
    const { space, user } = await generateUserAndSpace();
    await testUtilsSpaces.addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createProposals']
    });
    userId = user.id;

    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId
    });

    const template = await generateProposal({
      userId,
      spaceId: space.id,
      title: 'Proposal template',
      pageType: 'proposal_template',
      proposalStatus: 'draft',
      authors: []
    });

    await proposalListPage.goToProposals(space.domain);
    await proposalListPage.waitForProposalsList();
    await expect(proposalListPage.emptyState).toBeVisible();
    await proposalListPage.proposalTemplateSelect.click();
    await proposalListPage.getTemplateOptionLocator(template.id).click();

    await expect(proposalPage.saveDraftButton).toBeVisible();
  });
});
