import type { PostCategoryPermissionFlags } from '@charmverse/core/permissions';
import type { PostCategory, PostCategoryPermission, Space, User } from '@charmverse/core/prisma';
import { testUtilsForum, testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

describe('POST /api/permissions/forum/compute-post-category-permissions - Compute permissions for a forum post category', () => {
  let space: Space;
  let spaceMember: User;
  let postCategory: PostCategory;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    space = generated.space;
    spaceMember = generated.user;

    const role = await testUtilsMembers.generateRole({
      createdBy: spaceMember.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMember.id]
    });

    postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id,
      permissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'role', id: role.id }
        }
      ]
    });
  });

  it('should return computed permissions for a user and respond 200', async () => {
    const userCookie = await loginUser(spaceMember.id);
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
      manage_permissions: false,
      comment_posts: true,
      view_posts: true
    });
  });

  it('should return computed permissions for a user outside the space and respond 200', async () => {
    // Non logged in user test case
    const publicResult = (
      await request(baseUrl)
        .post('/api/permissions/forum/compute-post-category-permissions')
        .send({ resourceId: postCategory.id })
        .expect(200)
    ).body as PostCategoryPermission;

    expect(publicResult).toMatchObject(
      expect.objectContaining<PostCategoryPermissionFlags>({
        create_post: false,
        delete_category: false,
        edit_category: false,
        manage_permissions: false,
        comment_posts: false,
        view_posts: false
      })
    );
  });
});
