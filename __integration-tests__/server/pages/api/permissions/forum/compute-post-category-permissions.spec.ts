import type { PostCategoryPermissionFlags } from '@charmverse/core/permissions';
import type { PostCategoryPermission } from '@charmverse/core/prisma';
import { testUtilsForum, testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('POST /api/permissions/forum/compute-post-category-permissions - Compute permissions for a forum post category', () => {
  it('should return computed permissions for a user and non user, and respond 200', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    const postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id,
      permissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'role', id: role.id }
        }
      ]
    });

    const userCookie = await loginUser(user.id);
    const result = (
      await request(baseUrl)
        .post('/api/permissions/forum/compute-post-category-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: postCategory.id })
        .expect(200)
    ).body as PostCategoryPermission;

    expect(result).toMatchObject<PostCategoryPermissionFlags>({
      create_post: true,
      delete_category: false,
      edit_category: false,
      manage_permissions: false
    });

    // Non logged in user test case
    const publicResult = (
      await request(baseUrl)
        .post('/api/permissions/forum/compute-post-category-permissions')
        .send({ resourceId: postCategory.id })
        .expect(200)
    ).body as PostCategoryPermission;

    expect(publicResult).toMatchObject(
      expect.objectContaining({
        create_post: false,
        delete_category: false,
        edit_category: false,
        manage_permissions: false
      })
    );
  });
});
