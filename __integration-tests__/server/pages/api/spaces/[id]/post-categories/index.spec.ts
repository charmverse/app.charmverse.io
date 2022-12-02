/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PostCategory, Prisma, Space, User } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import type { CreatePostCategoryInput } from 'lib/forums/categories/createPostCategory';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let firstSpace: Space;
let firstSpaceAdminUser: User;
let firstSpaceUser: User;
let secondSpace: Space;
let secondSpaceUser: User;

beforeAll(async () => {
  const { space: _firstSpace, user: _firstAdminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

  firstSpace = _firstSpace;
  firstSpaceAdminUser = _firstAdminUser;
  firstSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: firstSpace.id });

  const { space: _secondSpace, user: _secondUser } = await generateUserAndSpaceWithApiToken(undefined, false);

  secondSpace = _secondSpace;
  secondSpaceUser = _secondUser;

  // Provision post categories for the second space
  const createInput: Prisma.PostCategoryCreateManyInput[] = [
    {
      name: 'Category 1',
      spaceId: secondSpace.id,
      color: '#000000'
    },
    {
      name: 'Category 2',
      spaceId: secondSpace.id,
      color: '#000000'
    },
    {
      name: 'Category 3',
      spaceId: secondSpace.id,
      color: '#000000'
    }
  ];

  await prisma.postCategory.createMany({
    data: createInput
  });
});

describe('POST /api/spaces/[id]/post-categories - Create a post category', () => {
  it('should create the post category if the user is a space admin, and return the post category, responding with 201', async () => {
    const adminUserCookie = await loginUser(firstSpaceAdminUser.id);

    const createInput: Partial<CreatePostCategoryInput> = {
      name: 'Test Category'
    };

    const postCategory = (
      await request(baseUrl)
        .post(`/api/spaces/${firstSpace.id}/post-categories`)
        .set('Cookie', adminUserCookie)
        .send(createInput)
        .expect(201)
    ).body as PostCategory;

    expect(postCategory.name).toBe(createInput.name);
    expect(postCategory.spaceId).toBe(firstSpace.id);
    expect(postCategory.color).toBeDefined();
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
  it('should return all post categories if the user is a space member, responding with 200', async () => {
    const userCookie = await loginUser(secondSpaceUser.id);

    const postCategories = (
      await request(baseUrl)
        .get(`/api/spaces/${secondSpace.id}/post-categories`)
        .set('Cookie', userCookie)
        .send()
        .expect(200)
    ).body as PostCategory[];

    expect(postCategories.length).toBe(3);
  });

  it('should fail to return the post categories if the user is not a space member, responding with 401', async () => {
    const userInOtherSpaceCookie = await loginUser(firstSpaceUser.id);

    await request(baseUrl)
      .get(`/api/spaces/${secondSpace.id}/post-categories`)
      .set('Cookie', userInOtherSpaceCookie)
      .send()
      .expect(401);
  });
});
