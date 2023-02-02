import type { PostCategoryPermission } from '@prisma/client';
import request from 'supertest';

import { computePostPermissions } from 'lib/permissions/forum/computePostPermissions';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

describe('POST /api/permissions/forum/compute-post-permissions - Compute permissions for a forum post', () => {
  it('should return computed permissions for a user and non user, and respond 200', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: user.id
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const userCookie = await loginUser(user.id);

    const computed = await computePostPermissions({
      resourceId: post.id,
      userId: user.id
    });

    const result = (
      await request(baseUrl)
        .post('/api/permissions/forum/compute-post-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: post.id })
        .expect(200)
    ).body as PostCategoryPermission;

    expect(result).toMatchObject(expect.objectContaining(computed));

    // Non logged in user test case
    const publicComputed = await computePostPermissions({
      resourceId: post.id,
      userId: undefined
    });
    const publicResult = (
      await request(baseUrl)
        .post('/api/permissions/forum/compute-post-permissions')
        .send({ resourceId: post.id })
        .expect(200)
    ).body as PostCategoryPermission;

    expect(publicResult).toMatchObject(expect.objectContaining(publicComputed));
  });
});
