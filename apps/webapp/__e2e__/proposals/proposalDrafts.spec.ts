import type { Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { generateProposalWorkflow } from '@packages/lib/testing/proposals';
import { expect, test } from '__e2e__/utils/test';
import { v4 as uuid } from 'uuid';

import { generateUserAndSpace, loginBrowserUser, generateUser } from '../utils/mocks';

test.describe('Creating a proposal', () => {
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

  test('Non-admin can create a new proposal', async ({ proposalListPage, proposalPage }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: member.id
    });

    await proposalListPage.goToNewProposalForm(space.domain);
    await proposalPage.waitForNewProposalPage();

    const path = await proposalPage.page.url();
    const pagePath = path.split('/').pop();

    // Test proposal data at the database level to ensure correct persistence
    const proposal = await prisma.proposal.findFirst({
      where: {
        page: {
          path: pagePath
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
    expect(proposal?.status).toBe('draft');
    expect(proposal?.page?.type).toBe('proposal');
  });

  test('Non-admin cannot create a template', async ({ proposalListPage, proposalPage }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: member.id
    });

    await proposalListPage.goToNewProposalForm(space.domain, '?type=proposal_template');
    await expect(proposalPage.errorPage).toBeVisible();
  });

  test('Admin can create a template ', async ({ proposalListPage, proposalPage }) => {
    const admin = await generateUser({ space: { id: space.id, isAdmin: true } });
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: admin.id
    });

    await proposalListPage.goToNewProposalForm(space.domain, '?type=proposal_template');
    await proposalPage.waitForNewProposalPage();

    const path = await proposalPage.page.url();
    const pagePath = path.split('/').pop();

    // Test proposal data at the database level to ensure correct persistence
    const proposal = await prisma.proposal.findFirst({
      where: {
        page: {
          path: pagePath
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
    expect(proposal?.status).toBe('draft');
    expect(proposal?.page?.type).toBe('proposal_template');
  });
});
