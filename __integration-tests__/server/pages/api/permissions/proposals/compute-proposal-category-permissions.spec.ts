import type { ProposalCategoryPermission } from '@charmverse/core/prisma';
import request from 'supertest';

import { computeProposalCategoryPermissions } from 'lib/permissions/proposals/computeProposalCategoryPermissions';
import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

describe('POST /api/permissions/proposals/compute-proposal-category-permissions - Compute permissions for a proposal category', () => {
  it('should return computed permissions for a user and non user, and respond 200', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
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

    const computed = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: user.id
    });

    const result = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-category-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: proposalCategory.id })
        .expect(200)
    ).body as ProposalCategoryPermission;

    expect(result).toMatchObject(expect.objectContaining(computed));

    // Non logged in user test case
    const publicComputed = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: undefined
    });
    const publicResult = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-category-permissions')
        .send({ resourceId: proposalCategory.id })
        .expect(200)
    ).body as ProposalCategoryPermission;

    expect(publicResult).toMatchObject(expect.objectContaining(publicComputed));
  });
});
