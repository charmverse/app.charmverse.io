import { generateForumPost } from '@charmverse/core';
import type { Post, Space, User } from '@charmverse/core/dist/prisma';
import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

let space: Space;
let adminUser: User;
let post: Post;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: false,
    // This ensures the public request will fail
    paidTier: 'pro'
  });
  space = generated.space;
  adminUser = generated.user;
  const postCategory = await generatePostCategory({
    spaceId: space.id
  });

  post = await generateForumPost({
    spaceId: space.id,
    userId: adminUser.id,
    categoryId: postCategory.id
  });
});

describe('GET /api/forums/posts/[postId] - Load a post', () => {
  it('should allow a user with access to load the post by path and spaceDomain if they have access, responding 200', async () => {
    const cookie = await loginUser(adminUser.id);

    const postResponse = await request(baseUrl)
      .get(`/api/forums/posts/${post.path}?spaceDomain=${space.domain}`)
      .set('Cookie', cookie)
      .send()
      .expect(200);

    expect(postResponse.body).toMatchObject({
      id: post.id,
      title: post.title,
      content: post.content
    });
  });

  it('should fail if the user does not have access, and respond 401', async () => {
    // Public request
    await request(baseUrl).get(`/api/forums/posts/${post.path}?spaceDomain=${space.domain}`).send().expect(401);
  });
});
