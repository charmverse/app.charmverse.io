import type { AssignedPostCategoryPermission } from '@charmverse/core';
import request from 'supertest';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

describe('GET /api/permissions/forum/list-post-category-permissions - List available category permissions', () => {
  it('should return list of post category permissions for a space member, responding 200', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    const postCategory = await generatePostCategory({
      spaceId: space.id
    });
    const permission = await upsertPostCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const userCookie = await loginUser(user.id);
    const result = (
      await request(baseUrl)
        .get(`/api/permissions/forum/list-post-category-permissions?resourceId=${postCategory.id}`)
        .set('Cookie', userCookie)
        .send({ resourceId: postCategory.id })
        .expect(200)
    ).body as AssignedPostCategoryPermission[];

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject(expect.objectContaining(permission));
  });
});
