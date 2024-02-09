import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';
import { test, expect } from '__e2e__/utils/test';

import { loginBrowserUser } from '../../utils/mocks';

test.describe('Proposals Feature', () => {
  let proposalsListPage: ProposalsListPage;
  let proposalPage: ProposalPage;
  const spaceDomain = 'example-space-domain';
  const userId = 'user-id-123';

  test.beforeEach(async ({ page }) => {
    proposalsListPage = new ProposalsListPage(page);
    proposalPage = new ProposalPage(page);
    await loginBrowserUser({
      browserPage: page,
      userId
    });
    await proposalsListPage.goToProposals(spaceDomain);
  });

  test('User creates and submits a new proposal', async () => {
    // Navigate to create new proposal page
    await proposalsListPage.addNewProposalButton.click();

    // Verify we're on the new proposal creation page
    await expect(proposalPage.pageTitle).toHaveText('Create New Proposal');

    // Fill in proposal details
    await proposalPage.proposalTitleInput.fill('Test Proposal Title');
    await proposalPage.proposalDescriptionInput.fill('This is a test proposal description.');

    // Submit the proposal
    await proposalPage.submitProposalButton.click();

    // Verify proposal submission
    await expect(proposalPage.submissionConfirmationMessage).toHaveText('Proposal submitted successfully');

    // Verify the proposal appears in the list
    await proposalsListPage.goToProposals(spaceDomain);
    await expect(proposalsListPage.getProposalByTitle('Test Proposal Title')).toBeVisible();
  });
});

test.describe('Proposals Feature', () => {
  test('User creates and submits a new proposal', async ({
    page,
    proposalPage,
    proposalListPage,
    documentPage,
    rewardPage
  }) => {
    // Test content
  });
});
