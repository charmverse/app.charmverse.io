import type { ProposalCategoryPermission, Space, User } from '@prisma/client';
import request from 'supertest';

import { computeProposalPermissions } from 'lib/permissions/proposals/computeProposalPermissions';
import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: false });

  space = generated.space;
  user = generated.user;
});

describe('POST /api/permissions/proposals/compute-proposal-permissions - Compute permissions for a proposal', () => {
  it('should return computed permissions for a user, and respond 200', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: user.id,
      authors: [user.id],
      proposalStatus: 'draft'
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    await upsertProposalCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    });

    const userCookie = await loginUser(user.id);

    const computed = await computeProposalPermissions({
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
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: user.id
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    await upsertProposalCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    });

    const userCookie = await loginUser(user.id);

    const computed = await computeProposalPermissions({
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
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await generateProposal({
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
    const publicComputed = await computeProposalPermissions({
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
