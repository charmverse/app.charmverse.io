/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PostCategory, PostCategoryPermission, Prisma, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 } from 'uuid';

import type { CreatePostCategoryInput } from '@packages/lib/forums/categories/createPostCategory';
import { upsertPostCategoryPermission } from '@packages/lib/permissions/forum/upsertPostCategoryPermission';

let firstSpace: Space;
let firstSpaceAdminUser: User;
let firstSpaceAdminUserCookie: string;
let firstSpaceUser: User;
let secondSpace: Space;
let secondSpaceUser: User;

// Just compare the IDs
const adminCategoryPermissionId = v4();
const publicCategoryPermissionId = v4();
const spaceCategoryPermissionId = v4();

beforeAll(async () => {
  const { space: _firstSpace, user: _firstAdminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

  firstSpace = _firstSpace;
  firstSpaceAdminUser = _firstAdminUser;
  firstSpaceAdminUserCookie = await loginUser(firstSpaceAdminUser.id);
  firstSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: firstSpace.id });

  const { space: _secondSpace, user: _secondUser } = await generateUserAndSpaceWithApiToken(undefined, false);

  secondSpace = _secondSpace;
  secondSpaceUser = _secondUser;

  // Provision post categories for the second space
  const createInput: Prisma.PostCategoryCreateManyInput[] = [
    {
      id: adminCategoryPermissionId,
      name: 'Admin Category',
      spaceId: secondSpace.id
    },
    {
      id: spaceCategoryPermissionId,
      name: 'Space Category',
      spaceId: secondSpace.id
    },
    {
      id: publicCategoryPermissionId,
      name: 'Public Category',
      spaceId: secondSpace.id
    }
  ];

  await prisma.postCategory.createMany({
    data: createInput
  });

  await upsertPostCategoryPermission({
    assignee: { group: 'space', id: secondSpace.id },
    permissionLevel: 'full_access',
    postCategoryId: spaceCategoryPermissionId
  });

  await upsertPostCategoryPermission({
    assignee: { group: 'public' },
    permissionLevel: 'view',
    postCategoryId: publicCategoryPermissionId
  });
});

describe('POST /api/spaces/[id]/post-categories - Create a post category', () => {
  it('should create the post category if the user is a space admin, and return the post category, responding with 201', async () => {
    const createInput: Partial<CreatePostCategoryInput> = {
      name: 'Test Category'
    };

    const postCategory = (
      await request(baseUrl)
        .post(`/api/spaces/${firstSpace.id}/post-categories`)
        .set('Cookie', firstSpaceAdminUserCookie)
        .send(createInput)
        .expect(201)
    ).body as PostCategory;

    expect(postCategory.name).toBe(createInput.name);
    expect(postCategory.spaceId).toBe(firstSpace.id);
  });

  it('should create a space / full access permission by default for the post category', async () => {
    const createInput: Partial<CreatePostCategoryInput> = {
      name: 'Category with default permission'
    };

    const category = (
      await request(baseUrl)
        .post(`/api/spaces/${firstSpace.id}/post-categories`)
        .set('Cookie', firstSpaceAdminUserCookie)
        .send(createInput)
        .expect(201)
    ).body as PostCategory;

    const permissions = await prisma.postCategoryPermission.findMany({
      where: {
        postCategoryId: category.id
      }
    });

    expect(permissions.length).toBe(1);

    const permission = permissions[0];

    expect(permission).toMatchObject(
      expect.objectContaining<PostCategoryPermission>({
        id: expect.any(String),
        spaceId: firstSpace.id,
        roleId: null,
        public: null,
        postCategoryId: category.id,
        permissionLevel: 'full_access',
        categoryOperations: [],
        postOperations: []
      })
    );
  });

  it('should fail to create the post category if the user is not a space admin, responding with 401', async () => {
    const userCookie = await loginUser(firstSpaceUser.id);

    const createInput: Partial<CreatePostCategoryInput> = {
      name: 'Test Category'
    };
    await request(baseUrl)
      .post(`/api/spaces/${firstSpace.id}/post-categories`)
      .set('Cookie', userCookie)
      .send(createInput)
      .expect(401);
  });
});
describe('GET /api/spaces/[id]/post-categories - Retrieve space post categories', () => {
  it('should return all post categories user can see, responding with 200', async () => {
    const userCookie = await loginUser(secondSpaceUser.id);

    const postCategories = (
      await request(baseUrl)
        .get(`/api/spaces/${secondSpace.id}/post-categories`)
        .set('Cookie', userCookie)
        .send()
        .expect(200)
    ).body as PostCategory[];

    expect(postCategories.length).toBe(2);
    expect(postCategories.some((p) => p.id === spaceCategoryPermissionId));
    expect(postCategories.some((p) => p.id === publicCategoryPermissionId));
  });

  it('should return all post categories for a space admin, responding with 200', async () => {
    const secondSpaceAdminUser = await generateSpaceUser({ isAdmin: true, spaceId: secondSpace.id });
    const adminUserCookie = await loginUser(secondSpaceAdminUser.id);

    const postCategories = (
      await request(baseUrl)
        .get(`/api/spaces/${secondSpace.id}/post-categories`)
        .set('Cookie', adminUserCookie)
        .send()
        .expect(200)
    ).body as PostCategory[];

    expect(postCategories.length).toBe(3);
    expect(postCategories.some((p) => p.id === adminCategoryPermissionId));
    expect(postCategories.some((p) => p.id === spaceCategoryPermissionId));
    expect(postCategories.some((p) => p.id === publicCategoryPermissionId));
  });

  it('should return only the public post categories if the user is not a space member, responding with 200', async () => {
    const userInOtherSpaceCookie = await loginUser(firstSpaceUser.id);

    const postCategories = (
      await request(baseUrl)
        .get(`/api/spaces/${secondSpace.id}/post-categories`)
        .set('Cookie', userInOtherSpaceCookie)
        .send()
        .expect(200)
    ).body as PostCategory[];
    expect(postCategories.length).toBe(1);
    expect(postCategories[0].id).toBe(publicCategoryPermissionId);
  });

  it('should return only the public post categories for a user who is not logged in, responding with 200', async () => {
    const postCategories = (
      await request(baseUrl).get(`/api/spaces/${secondSpace.id}/post-categories`).send().expect(200)
    ).body as PostCategory[];
    expect(postCategories.length).toBe(1);
    expect(postCategories[0].id).toBe(publicCategoryPermissionId);
  });
});
