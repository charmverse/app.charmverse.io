import { createPage } from '@packages/testing/setupDatabase';
import { generateProposalWorkflowWithEvaluations } from '@packages/testing/utils/proposals';
import { PageHeader } from '__e2e__/po/pageHeader.po';
import { expect, test as base } from '__e2e__/utils/test';

import { DocumentPage } from '../po/document.po';
import { generateUser, generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  documentPage: DocumentPage;
  pageHeader: PageHeader;
};

const test = base.extend<Fixtures>({
  pageHeader: ({ page }, use) => use(new PageHeader(page)),
  documentPage: ({ page }, use) => use(new DocumentPage(page))
});

test('convert page to proposal - create a page, convert that page to proposal and assert editor is readonly with proposal banner', async ({
  documentPage,
  pageHeader,
  proposalPage
}) => {
  const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });
  await generateProposalWorkflowWithEvaluations({ spaceId: space.id });

  await login({
    page: documentPage.page,
    userId: user.id
  });

  await documentPage.goToPage({
    domain: space.domain,
    path: generatedPage.path
  });

  await pageHeader.convertToProposal();

  await proposalPage.waitForNewProposalPage();

  // Go back to page to assert that we have the proposal conversion banner and editor is readonly
  await documentPage.goToPage({
    domain: space.domain,
    path: generatedPage.path
  });

  await expect(documentPage.proposalBanner).toBeVisible();

  const isEditable = await documentPage.isPageEditable();

  expect(isEditable).toBe(false);
});

test('convert page to proposal - does not allow a non-editor', async ({ documentPage, proposalPage }) => {
  const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });
  const nonEditor = await generateUser({ space: { id: space.id } });

  const page = await createPage({
    spaceId: space.id,
    createdBy: user.id,
    title: 'Test Page',
    pagePermissions: []
  });
  await generateProposalWorkflowWithEvaluations({ spaceId: space.id });

  await login({
    page: documentPage.page,
    userId: nonEditor.id
  });

  await documentPage.goToPage({
    domain: space.domain,
    path: `/proposals/new?sourcePageId=${page.id}`
  });

  await expect(documentPage.errorPage).toBeVisible();
});
