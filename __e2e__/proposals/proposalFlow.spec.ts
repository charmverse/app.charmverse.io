import { testUtilsProposals } from '@charmverse/core/test';
import { test, expect } from '@playwright/test';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';

import type { PageWithProposal } from 'lib/pages';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('A user can create a proposal with a space-wide vote', () => {
  // create reusable pages we can reuse between tests
  let proposalListPage: ProposalsListPage;
  let proposalPage: ProposalPage;

  let proposalId: string;
  let userId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    proposalListPage = new ProposalsListPage(page);
    proposalPage = new ProposalPage(page);
  });

  test('An user creates a draft proposal', async () => {
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

    await proposalListPage.goToProposals(space.domain);
    await proposalListPage.waitForProposalsList();
    await expect(proposalListPage.emptyState).toBeVisible();
    await proposalListPage.clickNewProposalDialog();

    await proposalPage.waitForDialog();
    await expect(proposalPage.saveDraftButton).toBeDisabled();

    // enter required fields
    await proposalPage.documentTitle.type('Proposal title');
    await proposalPage.categorySelect.click();
    await proposalPage.getSelectOption(category.id).click();
    await proposalPage.charmEditor.scrollIntoViewIfNeeded();
    await proposalPage.charmEditor.type('Proposal content');
    await proposalPage.reviewerSelect.click();
    await proposalPage.getSelectOption(userId).click();

    // save draft
    await expect(proposalPage.saveDraftButton).toBeEnabled();
    await proposalPage.saveDraftButton.click();

    const response = await proposalPage.waitForJsonResponse<PageWithProposal>('**/api/proposals');
    proposalId = response.proposal.id;

    // verify we are on the saved view
    await expect(proposalPage.openAsPageButton).toBeVisible();
    await expect(proposalPage.nextStatusButton).toBeEnabled();

    // verify that the page list was updated
    await proposalPage.closeDialog();
    await expect(proposalListPage.emptyState).not.toBeVisible();
    const proposalRow = proposalListPage.getProposalRowLocator(proposalId);
    await expect(proposalRow).toBeVisible();
  });

  test('An user moves draft proposal to feedback', async () => {
    await proposalListPage.getProposalRowLocator(proposalId).click();

    await expect(proposalPage.dialog).toBeVisible();
    await expect(proposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.discussion);

    await proposalPage.nextStatusButton.click();
    await proposalPage.confirmStatusButton.click();
    await expect(proposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.discussion);
  });
  test('An user moves feedback to In Review', async () => {
    await expect(proposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.review);
    await proposalPage.nextStatusButton.click();
    await proposalPage.confirmStatusButton.click();
    await expect(proposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.review);
  });

  test('An user moves feedback to Reviewed', async () => {
    await expect(proposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.reviewed);
    await proposalPage.nextStatusButton.click();
    await proposalPage.confirmStatusButton.click();
    await expect(proposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.reviewed);
  });

  test('An user creates a vote', async () => {
    await expect(proposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.vote_active);
    await proposalPage.nextStatusButton.click();
    await proposalPage.confirmStatusButton.click();
    await proposalPage.createVoteButton.click();
    await expect(proposalPage.voteContainer).toBeVisible();
  });
});
