import type { Page, Proposal, Role, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { baseUrl } from '@packages/testing/mockApiCall';
import { test as base, expect } from '@playwright/test';
import { DocumentPage } from '__e2e__/po/document.po';
import { PagePermissionsDialog } from '__e2e__/po/pagePermissions.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';

import { generateUser, loginBrowserUser, logoutBrowserUser } from '../utils/mocks';

type Fixtures = {
  proposalListPage: ProposalsListPage;
  documentPage: DocumentPage;
  pagePermissions: PagePermissionsDialog;
};

const test = base.extend<Fixtures>({
  proposalListPage: ({ page }, use) => use(new ProposalsListPage(page)),
  documentPage: ({ page }, use) => use(new DocumentPage(page)),
  pagePermissions: ({ page }, use) => use(new PagePermissionsDialog(page))
});

let space: Space;
let spaceAdmin: User;
let role: Role;
let proposalReviewer: User;
let proposalAuthor: User;
let draftProposal: Proposal;
let discussionProposal: Proposal & { page: Page };
let hiddenProposal: Proposal;

test.beforeAll(async () => {
  // Initial setup
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true,
    spaceName: 'space'
  });

  space = generated.space;
  spaceAdmin = generated.user;
  role = await testUtilsMembers.generateRole({
    createdBy: spaceAdmin.id,
    spaceId: space.id,
    roleName: 'Proposal Reviewer 2399'
  });

  proposalAuthor = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  proposalReviewer = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  await prisma.spaceRole.update({
    where: {
      spaceUser: {
        spaceId: space.id,
        userId: proposalAuthor.id
      }
    },
    data: {
      onboarded: true
    }
  });

  draftProposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: proposalAuthor.id,
    proposalStatus: 'draft'
  });

  discussionProposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: proposalAuthor.id,
    proposalStatus: 'published',
    evaluationInputs: [
      {
        evaluationType: 'feedback',
        reviewers: [],
        permissions: [
          { assignee: { group: 'space_member' }, operation: 'edit' },
          {
            assignee: { group: 'space_member' },
            operation: 'view'
          },
          { assignee: { group: 'public' }, operation: 'view' }
        ]
      }
    ]
  });

  hiddenProposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: spaceAdmin.id,
    proposalStatus: 'published'
  });
});

test.describe('View proposal', () => {
  test('Proposal author can view their own draft proposal and other accessible proposals as well as data about the proposals', async ({
    proposalListPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: proposalAuthor.id
    });

    // Finish setup start interacting with the app
    await proposalListPage.goToHomePage();

    await proposalListPage.getSidebarLink('proposals').click();

    await proposalListPage.waitForProposalsList();

    await proposalListPage.page.getByRole('tab', { name: 'All' }).click();

    const draftRow = proposalListPage.getProposalRowLocator(draftProposal.id);
    const discussionRow = proposalListPage.getProposalRowLocator(discussionProposal.id);
    const hiddenRow = proposalListPage.getProposalRowLocator(hiddenProposal.id);

    await expect(draftRow).toBeVisible();
    await expect(discussionRow).toBeVisible();
    await expect(hiddenRow).not.toBeVisible();
  });

  test('Space member can see proposals but not drafts', async ({ proposalListPage }) => {
    const spaceMember = await generateUser({ space: { id: space.id } });

    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: spaceMember.id
    });

    await proposalListPage.goToProposals(space.domain);
    await proposalListPage.waitForProposalsList();

    // Check the rows content
    const draftRow = proposalListPage.getProposalRowLocator(draftProposal.id);
    await expect(draftRow).not.toBeVisible();

    const feedbackRow = proposalListPage.getProposalRowLocator(discussionProposal.id);
    await expect(feedbackRow).toBeVisible();

    const feedbackRowStatusBadge = feedbackRow.filter({ hasText: 'In Progress' });
    await expect(feedbackRowStatusBadge).toBeVisible();
  });

  test('Proposal can be edited by the author, but not made public', async ({
    page,
    proposalListPage,
    documentPage,
    pagePermissions
  }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: page,
      userId: proposalAuthor.id
    });

    // Finish setup start interacting with the app
    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    // Select the row and open the page
    // Needed to reveal the button
    await proposalListPage.getProposalRowLocator(discussionProposal.id).hover();

    await proposalListPage.getProposalRowOpenLocator(discussionProposal.id).click();

    // Check we can see the contents
    await proposalListPage.waitForDocumentPage({
      domain: space.domain,
      path: discussionProposal.page.path
    });

    await expect(documentPage.charmEditor).toBeVisible();

    await page.waitForTimeout(3000);

    const isEditable = await documentPage.isPageEditable();

    await expect(isEditable).toBe(true);

    // Start sharing flow
    await pagePermissions.permissionDialog.click();

    await pagePermissions.publishTab.click();

    await expect(pagePermissions.publicShareToggle).toBeDisabled();
  });

  test('Public proposal can be seen by people outside the space', async ({ page, proposalListPage, documentPage }) => {
    await logoutBrowserUser({
      browserPage: page
    });

    const link = `${baseUrl}/${space.domain}/${discussionProposal.page.path}`;

    await page.goto(link);

    // Check we can see the contents
    await proposalListPage.waitForDocumentPage({
      domain: space.domain,
      path: discussionProposal.page.path
    });

    await expect(documentPage.documentTitle).toBeVisible();

    const title = await documentPage.documentTitle.allInnerTexts();

    expect(title[0].trim()).toBe(discussionProposal.page.title);

    await expect(documentPage.charmEditor).toBeVisible();

    await page.waitForTimeout(3000);

    const isEditable = await documentPage.isPageEditable();

    await expect(isEditable).toBe(false);
  });
});
