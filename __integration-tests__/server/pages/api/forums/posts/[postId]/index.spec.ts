/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import type { UpdateForumPostInput } from 'lib/forums/posts/updateForumPost';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost } from 'testing/utils/forums';

let space: Space;
let user: User;
let userCookie: string;
let adminUser: User;
let adminUserCookie: string;
let extraSpaceUser: User;
let extraSpaceUserCookie: string;
let postCategory: PostCategory;
let createInput: { spaceId: string; userId: string; categoryId: string };
const updateInput: UpdateForumPostInput = {
  title: 'New title'
};

beforeAll(async () => {
  const { space: _space, user: _user } = await generateUserAndSpaceWithApiToken(undefined, false);

  space = _space;
  user = _user;
  userCookie = await loginUser(user.id);
  adminUser = await generateSpaceUser({ isAdmin: true, spaceId: space.id });
  adminUserCookie = await loginUser(adminUser.id);

  postCategory = await createPostCategory({
    name: 'Test Category',
    spaceId: space.id
  });

  createInput = {
    spaceId: space.id,
    userId: user.id,
    categoryId: postCategory.id
  };

  extraSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

  extraSpaceUserCookie = await loginUser(extraSpaceUser.id);
});

describe('PUT /api/forums/posts/[postId] - Update a post', () => {
  it('should update a post if the user created it, responding with 200', async () => {
    const post = await generateForumPost(createInput);

    await request(baseUrl).put(`/api/forums/posts/${post.id}`).set('Cookie', userCookie).send(updateInput).expect(200);
  });

  it('should update a post if the user did not create the post, but is a space admin, responding with 200', async () => {
    const post = await generateForumPost(createInput);

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}`)
      .set('Cookie', adminUserCookie)
      .send(updateInput)
      .expect(200);
  });

  it('should fail to update the post if the user did not create it, responding with 401', async () => {
    const forumPost = await generateForumPost(createInput);

    const update: UpdateForumPostInput = {
      title: 'Updated title'
    };

    await request(baseUrl)
      .put(`/api/forums/posts/${forumPost.id}`)
      .set('Cookie', extraSpaceUserCookie)
      .send(update)
      .expect(401);
  });
});
describe('DELETE /api/forums/posts/[postId] - Delete a post', () => {
  it('should delete a post if the user created it, responding with 200', async () => {
    const page = await generateForumPost(createInput);

    await request(baseUrl).delete(`/api/forums/posts/${page.id}`).set('Cookie', userCookie).send().expect(200);

    const updatedPage = await prisma.page.findUnique({
      where: {
        id: page.id
      }
    });

    expect(updatedPage?.deletedAt).toBeDefined();
  });

  it('should delete a post if the user did not create the post, but is a space admin, responding with 200', async () => {
    const page = await generateForumPost(createInput);

    await request(baseUrl).delete(`/api/forums/posts/${page.id}`).set('Cookie', adminUserCookie).send().expect(200);
  });

  it('should fail to delete the post if the user did not create it, responding with 401', async () => {
    const page = await generateForumPost(createInput);

    await request(baseUrl)
      .delete(`/api/forums/posts/${page.id}`)
      .set('Cookie', extraSpaceUserCookie)
      .send()
      .expect(401);
  });
});
