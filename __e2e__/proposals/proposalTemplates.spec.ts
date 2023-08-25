import { testUtilsProposals } from '@charmverse/core/test';
import { test, expect } from '@playwright/test';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';

import { generateProposal } from 'testing/setupDatabase';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('Proposal templates', () => {
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

    userId = user.id;

    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId
    });

    const category = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      title: 'General',
      proposalCategoryPermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    const template = await generateProposal({
      userId,
      categoryId: category.id,
      spaceId: space.id,
      title: 'Proposal template',
      pageType: 'proposal_template',
      proposalStatus: 'draft',
      authors: [],
      reviewers: []
    });

    await proposalListPage.goToProposals(space.domain);
    await proposalListPage.waitForProposalsList();
    await expect(proposalListPage.emptyState).toBeVisible();
    await proposalListPage.proposalTemplateSelect.click();
    await proposalListPage.getTemplateOptionLocator(template.id).click();

    await proposalPage.waitForDialog();
    await expect(proposalPage.saveDraftButton).toBeVisible();
  });
});
