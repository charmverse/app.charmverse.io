/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PostCategory, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';
import request from 'supertest';

import type { PostCategoryUpdate } from 'lib//forums/categories/updatePostCategory';
import type { CreatePostCategoryInput } from 'lib/forums/categories/createPostCategory';

let firstSpace: Space;
let firstSpaceAdminUser: User;
let firstSpaceUser: User;

beforeAll(async () => {
  const { space: _firstSpace, user: _firstAdminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

  firstSpace = _firstSpace;
  firstSpaceAdminUser = _firstAdminUser;
  firstSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: firstSpace.id });
});

describe('PUT /api/spaces/[id]/post-categories/[postCategoryId] - Update a post category', () => {
  it('should update the post category if the user is a space admin, and return the post category, responding with 200', async () => {
    const adminUserCookie = await loginUser(firstSpaceAdminUser.id);

    const createInput: Partial<CreatePostCategoryInput> = {
      name: 'Test Category'
    };

    const postCategory = await generatePostCategory({
      spaceId: firstSpace.id,
      name: createInput.name as string
    });

    const updateInput: PostCategoryUpdate = {
      name: 'Test Category'
    };

    const updatedPostCategory = (
      await request(baseUrl)
        .put(`/api/spaces/${firstSpace.id}/post-categories/${postCategory.id}`)
        .set('Cookie', adminUserCookie)
        .send(updateInput)
        .expect(200)
    ).body as PostCategory;

    expect(updatedPostCategory.name).toBe(updateInput.name);
    expect(updatedPostCategory.spaceId).toBe(firstSpace.id);
  });

  it('should fail to update the post category if the user is not a space admin, responding with 401', async () => {
    const userCookie = await loginUser(firstSpaceUser.id);

    const createInput: Partial<CreatePostCategoryInput> = {
      name: 'Example Category'
    };

    const postCategory = await generatePostCategory({
      spaceId: firstSpace.id,
      name: createInput.name as string
    });

    const updateInput: PostCategoryUpdate = {
      name: 'New example category'
    };

    await request(baseUrl)
      .put(`/api/spaces/${firstSpace.id}/post-categories/${postCategory.id}`)
      .set('Cookie', userCookie)
      .send(updateInput)
      .expect(401);
  });
});

describe('DELETE /api/spaces/[id]/post-categories/[postCategoryId] - Delete a post category', () => {
  it('should delete the post category if the user is a space admin, responding with 200', async () => {
    const adminUserCookie = await loginUser(firstSpaceAdminUser.id);

    const createInput: Partial<CreatePostCategoryInput> = {
      name: 'Deletable category'
    };

    const postCategory = await generatePostCategory({
      spaceId: firstSpace.id,
      name: createInput.name as string
    });
    await request(baseUrl)
      .delete(`/api/spaces/${firstSpace.id}/post-categories/${postCategory.id}`)
      .set('Cookie', adminUserCookie)
      .expect(200);

    const category = await prisma.postCategory.findUnique({
      where: {
        id: postCategory.id
      }
    });

    expect(category).toBeNull();
  });

  it('should fail to delete the post category if the user is not a space admin, responding with 401', async () => {
    const userCookie = await loginUser(firstSpaceUser.id);

    const createInput: Partial<CreatePostCategoryInput> = {
      name: 'Deletable category 2'
    };

    const postCategory = await generatePostCategory({
      spaceId: firstSpace.id,
      name: createInput.name as string
    });
    await request(baseUrl)
      .delete(`/api/spaces/${firstSpace.id}/post-categories/${postCategory.id}`)
      .set('Cookie', userCookie)
      .expect(401);
  });
});
