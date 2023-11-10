import type { Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { expect } from '@playwright/test';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';
import { test } from '__e2e__/utils/test';

import type { PageWithProposal } from 'lib/pages';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('Proposal Flow', () => {
  // create reusable pages we can reuse between tests

  let authorBrowserProposalListPage: ProposalsListPage;
  let authorBrowserProposalPage: ProposalPage;

  let pageWithProposal: PageWithProposal;
  let proposalId: string;

  let proposalAuthor: User;
  let proposalReviewer: User;
  let space: Space;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    ({ space, user: proposalAuthor } = await generateUserAndSpace({}));
    proposalReviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    await prisma.spaceRole.update({
      where: { spaceUser: { userId: proposalReviewer.id, spaceId: space.id } },
      data: { onboarded: true }
    });

    authorBrowserProposalListPage = new ProposalsListPage(page);
    authorBrowserProposalPage = new ProposalPage(page);
  });

  test('A user can create a draft proposal', async () => {
    // Initial setup
    await loginBrowserUser({
      browserPage: authorBrowserProposalListPage.page,
      userId: proposalAuthor.id
    });

    await authorBrowserProposalListPage.goToProposals(space.domain);

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

    await authorBrowserProposalListPage.goToProposals(space.domain);
    await authorBrowserProposalListPage.waitForProposalsList();
    await expect(authorBrowserProposalListPage.emptyState).toBeVisible();
    await authorBrowserProposalListPage.createProposalButton.click();

    await authorBrowserProposalPage.waitForDialog();
    await expect(authorBrowserProposalPage.saveDraftButton).toBeDisabled();

    // enter required fields
    await authorBrowserProposalPage.documentTitle.type('Proposal title');
    await authorBrowserProposalPage.categorySelect.click();
    await authorBrowserProposalPage.getSelectOption(category.id).click();
    await authorBrowserProposalPage.charmEditor.scrollIntoViewIfNeeded();
    await authorBrowserProposalPage.charmEditor.type('Proposal content');
    await authorBrowserProposalPage.reviewerSelect.click();
    // Add reviewer user as reviewer
    await authorBrowserProposalPage.getSelectOption(proposalReviewer.id).click();

    // save draft
    await expect(authorBrowserProposalPage.saveDraftButton).toBeEnabled();
    await authorBrowserProposalPage.saveDraftButton.click();

    const response = await authorBrowserProposalPage.waitForJsonResponse<PageWithProposal>('**/api/proposals');
    pageWithProposal = response;
    proposalId = pageWithProposal.proposal.id;

    // verify that the page list was updated
    await expect(authorBrowserProposalListPage.emptyState).not.toBeVisible();
    const proposalRow = authorBrowserProposalListPage.getProposalRowLocator(proposalId);
    await expect(proposalRow).toBeVisible();
  });

  test('A proposal author can move draft proposal to feedback', async () => {
    await authorBrowserProposalListPage.openProposalCard(proposalId);

    await expect(authorBrowserProposalPage.dialog).toBeVisible();
    await expect(authorBrowserProposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.discussion);

    await authorBrowserProposalPage.nextStatusButton.click();
    await authorBrowserProposalPage.confirmStatusButton.click();
    await expect(authorBrowserProposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.discussion);
  });
  test('A proposalAuthor can move feedback to In Review', async () => {
    await expect(authorBrowserProposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.review);
    await authorBrowserProposalPage.nextStatusButton.click();
    await authorBrowserProposalPage.confirmStatusButton.click();
    await expect(authorBrowserProposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.review);
  });

  test('A reviewer can move feedback to Reviewed', async ({ proposalPage }) => {
    await loginBrowserUser({
      browserPage: proposalPage.page,
      userId: proposalReviewer.id
    });
    await proposalPage.goToPage({ domain: space.domain, path: pageWithProposal.path });
    await proposalPage.waitForDocumentPage({ domain: space.domain, path: pageWithProposal.path });

    await expect(proposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.reviewed);
    await proposalPage.nextStatusButton.click();
    await proposalPage.confirmStatusButton.click();
    await expect(proposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.reviewed);
  });

  test('A proposal author can create a vote', async () => {
    await authorBrowserProposalPage.closeDialog();
    await authorBrowserProposalPage.goToPage({ domain: space.domain, path: pageWithProposal.path });
    await expect(authorBrowserProposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.vote_active);
    await authorBrowserProposalPage.nextStatusButton.click();
    await authorBrowserProposalPage.confirmStatusButton.click();
    await authorBrowserProposalPage.createVoteButton.click();
    await expect(authorBrowserProposalPage.voteContainer).toBeVisible();
  });
});
