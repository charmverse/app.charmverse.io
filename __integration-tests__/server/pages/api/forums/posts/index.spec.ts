/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@prisma/client';
import request from 'supertest';

import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import type { CreateForumPostInput } from 'lib/forums/posts/createForumPost';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let firstSpace: Space;
let firstSpaceUser: User;
let firstSpacePostCategory: PostCategory;
let secondSpace: Space;
let secondSpaceUser: User;

beforeAll(async () => {
  const { space: _firstSpace, user: _firstAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

  firstSpace = _firstSpace;
  firstSpaceUser = _firstAdminUser;
  firstSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: firstSpace.id });

  const { space: _secondSpace, user: _secondUser } = await generateUserAndSpaceWithApiToken(undefined, false);

  secondSpace = _secondSpace;
  secondSpaceUser = _secondUser;

  firstSpacePostCategory = await createPostCategory({
    name: 'Test Category',
    spaceId: firstSpace.id
  });
});

describe('POST /api/forums/posts - Create a post', () => {
  it('should create a draft post if the user is a space member (even if no space permissions to create pages exist), and return the post, responding with 201', async () => {
    const userCookie = await loginUser(firstSpaceUser.id);

    const createInput: CreateForumPostInput = {
      content: { type: 'doc' },
      contentText: 'Empty',
      spaceId: firstSpace.id,
      title: 'Test Post',
      createdBy: firstSpaceUser.id,
      categoryId: firstSpacePostCategory.id
    };

    const post = (
      await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(201)
    ).body as Post;

    expect(post).toMatchObject(
      expect.objectContaining<Partial<Post>>({
        id: expect.any(String),
        content: expect.any(Object),
        locked: false,
        pinned: false
      })
    );
  });

  it('should fail to create the post if the user is not a space member, responding with 401', async () => {
    const userCookie = await loginUser(secondSpaceUser.id);

    const createInput: CreateForumPostInput = {
      content: { type: 'doc' },
      contentText: 'Empty',
      spaceId: firstSpace.id,
      title: 'Test Post',
      createdBy: firstSpaceUser.id,
      categoryId: firstSpacePostCategory.id
    };

    await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(401);
  });
});
