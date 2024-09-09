import type { PostCategoryPermissionAssignment, AssignedPostCategoryPermission } from '@charmverse/core/permissions';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

let user: LoggedInUser;
let userCookie: string;
let adminUser: LoggedInUser;
let adminUserCookie: string;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generated.space;
  adminUser = generated.user;
  adminUserCookie = await loginUser(adminUser.id);

  user = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  userCookie = await loginUser(user.id);
});

describe('POST /api/permissions/forum - Add post category permissions', () => {
  it('should succeed if the user has "manage_permissions" access for the category, and respond 201', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'category_admin',
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const permissionToCreate: PostCategoryPermissionAssignment = {
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    };

    const result = (
      await request(baseUrl)
        .post('/api/permissions/forum')
        .set('Cookie', userCookie)
        .send(permissionToCreate)
        .expect(201)
    ).body as AssignedPostCategoryPermission;

    expect(result).toMatchObject(
      expect.objectContaining<AssignedPostCategoryPermission>({
        id: expect.any(String),
        permissionLevel: 'full_access',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    );
  });

  it('should succeed if the user is a space administrator and respond 201', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    const permissionToCreate: PostCategoryPermissionAssignment = {
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    };

    const result = (
      await request(baseUrl)
        .post('/api/permissions/forum')
        .set('Cookie', adminUserCookie)
        .send(permissionToCreate)
        .expect(201)
    ).body as AssignedPostCategoryPermission;

    expect(result).toMatchObject(
      expect.objectContaining<AssignedPostCategoryPermission>({
        id: expect.any(String),
        permissionLevel: 'full_access',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    );
  });

  it('should fail if the user does not have "manage_permissions" access for the category and respond 401', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });
    const permissionToCreate: PostCategoryPermissionAssignment = {
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    };

    await request(baseUrl)
      .post('/api/permissions/forum')
      .set('Cookie', userCookie)
      .send(permissionToCreate)
      .expect(401);
  });
});

describe('DELETE /api/permissions/forum - Delete post category permissions', () => {
  it('should succeed if the user has "manage_permissions" access for the category, and respond 200', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'category_admin',
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const permissionToDelete = await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    await request(baseUrl)
      .delete('/api/permissions/forum')
      .set('Cookie', userCookie)
      .query({ permissionId: permissionToDelete.id })
      .expect(200);
  });

  it('should succeed if the user is a space administrator and respond 200', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });
    const permissionToDelete = await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    await request(baseUrl)
      .delete('/api/permissions/forum')
      .set('Cookie', adminUserCookie)
      .query({ permissionId: permissionToDelete.id })
      .expect(200);
  });

  it('should fail if the user does not have "manage_permissions" access for the category and respond 401', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    const permissionToDelete = await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    await request(baseUrl)
      .delete('/api/permissions/forum')
      .set('Cookie', userCookie)
      .query({ permissionId: permissionToDelete.id })
      .expect(401);
  });
});
