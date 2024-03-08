import type { Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { expect, test } from '__e2e__/utils/test';
import { v4 as uuid } from 'uuid';

import { generateProposalWorkflow } from 'testing/utils/proposals';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe('Proposal Drafts', () => {
  let space: Space;
  let member: User;

  test.beforeAll(async ({ browser }) => {
    ({ space, user: member } = await generateUserAndSpace({
      isAdmin: false,
      spaceDomain: `cvt-${uuid()}`,
      memberSpacePermissions: ['createProposals']
    }));
    await generateProposalWorkflow({
      spaceId: space.id,
      evaluations: [{ type: 'pass_fail' }] // pass_fail requires reviewers to be set
    });
  });

  test('Can save a draft without filling out required fields', async ({ proposalListPage, proposalPage }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: member.id
    });

    await proposalListPage.goToNewProposalForm(space.domain);

    proposalPage.saveDraftButton.click();

    const result = await proposalPage.page.waitForResponse('**/api/proposals');

    const pageId = await result.json().then((data) => data.id);

    // Test proposal data at the database level to ensure correct persistence
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: pageId
      },
      include: {
        evaluations: {
          include: {
            reviewers: true,
            permissions: true,
            rubricCriteria: true
          },
          orderBy: { index: 'asc' }
        },
        page: true
      }
    });
    expect(proposal).toBeTruthy();
  });

  test('Can save a template draft', async ({ proposalListPage, proposalPage }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: member.id
    });

    await proposalListPage.goToNewProposalForm(space.domain, '?type=proposal_template');

    proposalPage.saveDraftButton.click();

    const result = await proposalPage.page.waitForResponse('**/api/proposals');

    const pageId = await result.json().then((data) => data.id);

    // Test proposal data at the database level to ensure correct persistence
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: pageId,
        page: {
          type: 'proposal_template'
        }
      },
      include: {
        evaluations: {
          include: {
            reviewers: true,
            permissions: true,
            rubricCriteria: true
          },
          orderBy: { index: 'asc' }
        },
        page: true
      }
    });
    expect(proposal).toBeTruthy();
  });
});
