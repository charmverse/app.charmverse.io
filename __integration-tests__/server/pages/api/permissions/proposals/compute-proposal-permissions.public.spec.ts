import type { ProposalCategoryPermission, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import { publicPermissionsClient } from 'lib/permissions/api/client';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });

  space = generated.space;
  user = generated.user;
});

describe('POST /api/permissions/proposals/compute-proposal-permissions - Compute permissions for a proposal - public space', () => {
  it('should return computed permissions for a user, and respond 200', async () => {
    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: user.id,
      authors: [user.id],
      proposalStatus: 'draft'
    });

    const userCookie = await loginUser(user.id);

    const computed = await publicPermissionsClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: user.id
    });

    const result = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: proposal.id })
        .expect(200)
    ).body as ProposalCategoryPermission;

    expect(result).toMatchObject(expect.objectContaining(computed));
  });

  it('should support proposal path + domain as a resource ID for requesting permissions compute, and respond 200', async () => {
    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: user.id
    });
    const userCookie = await loginUser(user.id);

    const computed = await publicPermissionsClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: user.id
    });

    const result = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: `${space.domain}/${proposal.page.path}` })
        .expect(200)
    ).body as ProposalCategoryPermission;

    expect(result).toMatchObject(expect.objectContaining(computed));
  });

  it('should return computed permissions for a non user, and respond 200', async () => {
    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: user.id
    });

    // Non logged in user test case
    const publicComputed = await publicPermissionsClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: undefined
    });
    const publicResult = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .send({ resourceId: proposal.id })
        .expect(200)
    ).body as ProposalCategoryPermission;

    expect(publicResult).toMatchObject(expect.objectContaining(publicComputed));
  });
});
