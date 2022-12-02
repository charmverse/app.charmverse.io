/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import type { CreateForumPostInput } from 'lib/forums/posts/createForumPost';
import { createForumPost } from 'lib/forums/posts/createForumPost';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import type { UpdateForumPostInput } from 'lib/forums/posts/updateForumPost';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let space: Space;
let user: User;
let userCookie: string;
let adminUser: User;
let adminUserCookie: string;
let extraSpaceUser: User;
let extraSpaceUserCookie: string;
let postCategory: PostCategory;
// A post created by user, which extraSpaceUser and adminUser will try to edit
let createInput: CreateForumPostInput;
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
    content: { type: 'doc' },
    contentText: 'Empty',
    spaceId: space.id,
    title: 'Test Post',
    createdBy: user.id,
    categoryId: postCategory.id
  };

  extraSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

  extraSpaceUserCookie = await loginUser(extraSpaceUser.id);
});

describe('PUT /api/forums/posts/[postId] - Update a post', () => {
  it('should update a post if the user created it, responding with 200', async () => {
    const post = (
      await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(201)
    ).body as ForumPostPage;

    const updatedPost = (
      await request(baseUrl).put(`/api/forums/posts/${post.id}`).set('Cookie', userCookie).send(updateInput).expect(200)
    ).body as ForumPostPage;

    expect(updatedPost).toMatchObject({
      ...post,
      title: updateInput.title
    });
  });

  it('should update a post if the user did not create the post, but is a space admin, responding with 200', async () => {
    const post = (
      await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(201)
    ).body as ForumPostPage;

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}`)
      .set('Cookie', adminUserCookie)
      .send(updateInput)
      .expect(200);
  });

  it('should fail to update the post if the user did not create it, responding with 401', async () => {
    const forumPost = await createForumPost({
      content: { type: 'doc' },
      contentText: 'Empty',
      spaceId: space.id,
      title: 'Test Post',
      createdBy: user.id,
      categoryId: postCategory.id
    });

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
    const post = (
      await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(201)
    ).body as ForumPostPage;

    await request(baseUrl).delete(`/api/forums/posts/${post.id}`).set('Cookie', userCookie).send().expect(200);

    const deletedPost = await prisma.post.findUnique({
      where: {
        id: post.id
      }
    });

    expect(deletedPost).toBeNull();
  });

  it('should delete a post if the user did not create the post, but is a space admin, responding with 200', async () => {
    const post = (
      await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(201)
    ).body as ForumPostPage;

    await request(baseUrl).delete(`/api/forums/posts/${post.id}`).set('Cookie', adminUserCookie).send().expect(200);
  });

  it('should fail to update the post if the user did not create it, responding with 401', async () => {
    const forumPost = await createForumPost(createInput);

    await request(baseUrl)
      .delete(`/api/forums/posts/${forumPost.id}`)
      .set('Cookie', extraSpaceUserCookie)
      .send()
      .expect(401);
  });
});
