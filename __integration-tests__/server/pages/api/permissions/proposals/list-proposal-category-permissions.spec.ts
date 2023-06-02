import type { AssignedProposalCategoryPermission } from '@charmverse/core';
import request from 'supertest';

import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

describe('GET /api/permissions/proposals/list-proposal-category-permissions - List available category permissions', () => {
  it('should return list of proposal category permissions for a space member, responding 200', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });
    const permission = await upsertProposalCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    });

    const userCookie = await loginUser(user.id);
    const result = (
      await request(baseUrl)
        .get(`/api/permissions/proposals/list-proposal-category-permissions?resourceId=${proposalCategory.id}`)
        .set('Cookie', userCookie)
        .send({ resourceId: proposalCategory.id })
        .expect(200)
    ).body as AssignedProposalCategoryPermission[];

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject(expect.objectContaining(permission));
  });
});
