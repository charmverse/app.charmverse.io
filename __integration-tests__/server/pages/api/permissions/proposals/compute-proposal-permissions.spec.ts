import type { PermissionCompute, ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { Space, User } from '@charmverse/core/prisma';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import { permissionsApiClient } from 'lib/permissions/api/routers';
import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('POST /api/permissions/proposals/compute-proposal-permissions - Compute permissions for a proposal', () => {
  let space: Space;
  let user: User;
  let reviewer: User;
  let secondReviewer: User;

  let userCookie: string;
  let reviewerCookie: string;
  let secondReviewerCookie: string;

  beforeAll(async () => {
    ({ space, user } = await testUtilsUser.generateUserAndSpace({ isAdmin: false }));
    reviewer = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    secondReviewer = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    userCookie = await loginUser(user.id);

    reviewerCookie = await loginUser(reviewer.id);
    secondReviewerCookie = await loginUser(secondReviewer.id);
  });

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

    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    await upsertProposalCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    });

    const computed = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: user.id
    });

    const result = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: proposal.id })
        .expect(200)
    ).body as ProposalPermissionFlags;

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

    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    await upsertProposalCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    });

    const computed = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: user.id
    });

    const result = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: `${space.domain}/${proposal.page.path}` })
        .expect(200)
    ).body as ProposalPermissionFlags;

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

    await upsertProposalCategoryPermission({
      assignee: { group: 'public' },
      permissionLevel: 'view',
      proposalCategoryId: proposalCategory.id
    });

    // Non logged in user test case
    const publicComputed = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: undefined
    });
    const publicResult = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .send({ resourceId: proposal.id })
        .expect(200)
    ).body as ProposalPermissionFlags;

    expect(publicResult).toMatchObject(expect.objectContaining(publicComputed));
  });
});

describe('GET /api/permissions/proposals/compute-proposal-permissions - Compute permissions for a proposal in a space with the new model', () => {
  let space: Space;
  let user: User;
  let reviewer: User;
  let secondReviewer: User;

  let userCookie: string;
  let reviewerCookie: string;
  let secondReviewerCookie: string;

  beforeAll(async () => {
    ({ space, user } = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spaceName: `cvt-${uuid()}` }));
    reviewer = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    secondReviewer = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    userCookie = await loginUser(user.id);

    reviewerCookie = await loginUser(reviewer.id);
    secondReviewerCookie = await loginUser(secondReviewer.id);
  });
  it('should use the new proposal permissions model if use flag is true', async () => {
    const proposalCategoryWithoutPermissions = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: []
    });

    const userDraftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategoryWithoutPermissions.id,
      proposalStatus: 'draft',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [{ group: 'user', id: reviewer.id }] }]
    });

    const userDraftPermissions = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', userCookie)
        .send({
          resourceId: userDraftProposal.id
        } as PermissionCompute)
        .expect(200)
    ).body as ProposalPermissionFlags;

    const reviewerDraftPermissions = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', reviewerCookie)
        .send({
          resourceId: userDraftProposal.id
        } as PermissionCompute)
        .expect(200)
    ).body as ProposalPermissionFlags;

    const secondReviewerDraftPermissions = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', secondReviewerCookie)
        .send({
          resourceId: userDraftProposal.id
        } as PermissionCompute)
        .expect(200)
    ).body as ProposalPermissionFlags;

    const userInReviewProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategoryWithoutPermissions.id,
      proposalStatus: 'published',
      evaluationInputs: [
        { evaluationType: 'rubric', permissions: [], reviewers: [{ group: 'user', id: reviewer.id }], result: 'pass' },
        { evaluationType: 'rubric', permissions: [], reviewers: [{ group: 'user', id: secondReviewer.id }] }
      ]
    });

    const userInReviewProposalPermissions = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', userCookie)
        .send({
          resourceId: userInReviewProposal.id
        } as PermissionCompute)
        .expect(200)
    ).body as ProposalPermissionFlags;

    const reviewerInReviewProposalPermissions = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', reviewerCookie)
        .send({
          resourceId: userInReviewProposal.id
        } as PermissionCompute)
        .expect(200)
    ).body as ProposalPermissionFlags;

    const secondReviewerInReviewProposalPermissions = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-permissions')
        .set('Cookie', secondReviewerCookie)
        .send({
          resourceId: userInReviewProposal.id
        } as PermissionCompute)
        .expect(200)
    ).body as ProposalPermissionFlags;

    expect([
      userInReviewProposalPermissions.view,
      reviewerInReviewProposalPermissions.view,
      secondReviewerInReviewProposalPermissions.view
    ]).toEqual([true, false, true]);
  });
});
