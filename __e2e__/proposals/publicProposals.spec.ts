import type { Page, Proposal, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { expect, test } from '__e2e__/utils/test';

import { generateUser, generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe('View a proposal with workflow permissions, and space enabled public proposals', () => {
  let space: Space;
  let admin: User;
  let member: User;
  let externalUser: User;
  let proposal: Proposal & { page: Page };
  const proposalTitle = 'Proposal E2E test visibility title';

  test.beforeAll(async () => {
    ({ user: admin, space } = await generateUserAndSpace({ isAdmin: true }));
    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        publicProposals: true
      }
    });
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

    await prisma.spaceRole.update({
      where: {
        spaceUser: {
          userId: member.id,
          spaceId: space.id
        }
      },
      data: {
        onboarded: true
      }
    });

    externalUser = await generateUser({});
    proposal = await testUtilsProposals.generateProposal({
      title: proposalTitle,
      spaceId: space.id,
      userId: admin.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'feedback', permissions: [], reviewers: [{ group: 'user', id: admin.id }] }]
    });
  });

  test('View a proposal without permissions as a space member, but space enabled public proposals', async ({
    page,
    proposalPage,
    documentPage
  }) => {
    // Test space member
    await loginBrowserUser({ browserPage: page, userId: member.id });

    await documentPage.goToPage({ domain: space.domain, path: proposal.page.path });

    await expect(proposalPage.documentTitle).toHaveText(proposalTitle);
  });

  test('View a proposal without permissions as an external user, but space enabled public proposals', async ({
    page,
    proposalPage,
    documentPage
  }) => {
    // Test external user
    await loginBrowserUser({ browserPage: page, userId: externalUser.id });
    await documentPage.goToPage({ domain: space.domain, path: proposal.page.path });

    await expect(proposalPage.documentTitle).toHaveText(proposalTitle);
  });

  test('View a proposal without permissions as a non logged in user, but space enabled public proposals', async ({
    proposalPage,
    documentPage
  }) => {
    // Test logged out user
    await documentPage.goToPage({ domain: space.domain, path: proposal.page.path });

    await expect(proposalPage.documentTitle).toHaveText(proposalTitle);
  });
});

test.describe('View a proposal without workflow permissions, but proposal has a public page permission', () => {
  let space: Space;
  let admin: User;
  let member: User;
  let externalUser: User;
  let proposal: Proposal & { page: Page };
  const proposalTitle = 'Proposal E2E test visibility title';

  test.beforeAll(async () => {
    ({ user: admin, space } = await generateUserAndSpace({ isAdmin: true }));
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

    await prisma.spaceRole.update({
      where: {
        spaceUser: {
          userId: member.id,
          spaceId: space.id
        }
      },
      data: {
        onboarded: true
      }
    });

    externalUser = await generateUser({});
    proposal = await testUtilsProposals.generateProposal({
      title: proposalTitle,
      spaceId: space.id,
      userId: admin.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'feedback', permissions: [], reviewers: [{ group: 'user', id: admin.id }] }]
    });

    await prisma.pagePermission.create({
      data: {
        page: { connect: { id: proposal.page.id } },
        permissionLevel: 'view',
        public: true
      }
    });
  });

  test('View a proposal without permissions as a space member, but proposal has a public page permission', async ({
    page,
    proposalPage,
    documentPage
  }) => {
    // Test space member
    await loginBrowserUser({ browserPage: page, userId: member.id });

    await documentPage.goToPage({ domain: space.domain, path: proposal.page.path });

    await expect(proposalPage.documentTitle).toHaveText(proposalTitle);
  });

  test('View a proposal without permissions as an external user, but proposal has a public page permission', async ({
    page,
    proposalPage,
    documentPage
  }) => {
    // Test external user
    await loginBrowserUser({ browserPage: page, userId: externalUser.id });
    await documentPage.goToPage({ domain: space.domain, path: proposal.page.path });

    await expect(proposalPage.documentTitle).toHaveText(proposalTitle);
  });

  test('View a proposal without permissions as a non logged in user, but proposal has a public page permission', async ({
    proposalPage,
    documentPage
  }) => {
    // Test logged out user
    await documentPage.goToPage({ domain: space.domain, path: proposal.page.path });

    await expect(proposalPage.documentTitle).toHaveText(proposalTitle);
  });
});
