/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost } from 'testing/utils/forums';

let space: Space;
let user: User;
let nonSpaceUser: User;
let userCookie: string;
let nonSpaceUserCookie: string;

beforeAll(async () => {
  const { space: _space, user: _user } = await generateUserAndSpaceWithApiToken(undefined, false);
  const { space: _space2, user: _user2 } = await generateUserAndSpaceWithApiToken(undefined, false);

  space = _space;
  user = _user;
  nonSpaceUser = _user2;
  userCookie = await loginUser(user.id);
  nonSpaceUserCookie = await loginUser(nonSpaceUser.id);
});

describe('GET /api/forums/posts/[postId]/comments - Get comments of a post', () => {
  it('should return a list of post comments with vote information, responding with 200', async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    await request(baseUrl).get(`/api/forums/posts/${post.id}/comments`).set('Cookie', userCookie).expect(200);
  });
});

describe('POST /api/forums/posts/[postId]/comments - Create a comment', () => {
  it('should throw error if post is not found, responding with 404', async () => {
    await request(baseUrl).post(`/api/forums/posts/${v4()}/comments`).set('Cookie', userCookie).expect(404);
  });

  it(`should throw error if user doesn't have access to workspace, responding with 401`, async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/comments`)
      .send({})
      .set('Cookie', nonSpaceUserCookie)
      .expect(401);
  });
  it('should create comment, responding with 200', async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/comments`)
      .send({
        content: {},
        contentText: '',
        parentId: v4()
      })
      .set('Cookie', userCookie)
      .expect(200);
  });
});
