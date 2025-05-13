import type { PostCategoryPermission, Space, User } from '@charmverse/core/prisma';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateRole, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import request from 'supertest';

import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { upsertPostCategoryPermission } from '@packages/lib/permissions/forum/upsertPostCategoryPermission';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: false });

  space = generated.space;
  user = generated.user;
});

describe('POST /api/permissions/forum/compute-post-permissions - Compute permissions for a forum post', () => {
  it('should return computed permissions for a user, and respond 200', async () => {
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

    const computed = await permissionsApiClient.forum.computePostPermissions({
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
  });

  it('should support post path + domain as a resource ID for requesting permissions compute, and respond 200', async () => {
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

    const computed = await permissionsApiClient.forum.computePostPermissions({
      resourceId: post.id,
      userId: user.id
    });

    const result = (
      await request(baseUrl)
        .post('/api/permissions/forum/compute-post-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: `${space.domain}/${post.path}` })
        .expect(200)
    ).body as PostCategoryPermission;

    expect(result).toMatchObject(expect.objectContaining(computed));
  });

  it('should return computed permissions for a non user, and respond 200', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: user.id
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'public' },
      permissionLevel: 'view',
      postCategoryId: postCategory.id
    });

    // Non logged in user test case
    const publicComputed = await permissionsApiClient.forum.computePostPermissions({
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
