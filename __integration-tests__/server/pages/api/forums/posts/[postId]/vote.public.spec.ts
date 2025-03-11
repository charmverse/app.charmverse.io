/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import type { PostVote } from 'lib/forums/posts/voteForumPost';

let space: Space;
let user: User;
let userCookie: string;
let adminUser: User;
let adminUserCookie: string;
let postCategory: PostCategory;
let post: Post;

beforeAll(async () => {
  const { space: _space, user: _user } = await testUtilsUser.generateUserAndSpace({
    isAdmin: false,
    spacePaidTier: 'free'
  });

  space = _space;
  user = _user;
  userCookie = await loginUser(user.id);
  adminUser = await testUtilsUser.generateSpaceUser({ isAdmin: true, spaceId: space.id });
  adminUserCookie = await loginUser(adminUser.id);

  postCategory = await testUtilsForum.generatePostCategory({
    name: 'Test Category',
    spaceId: space.id
  });

  post = await testUtilsForum.generateForumPost({
    spaceId: space.id,
    userId: adminUser.id,
    categoryId: postCategory.id
  });
});

describe('POST /api/forums/posts/[postId]/vote - Vote on a post - public space', () => {
  // In public mode, we don't need to assign explicit permissions to a post category
  it('should allow a space member to vote on a forum post, responding with 200', async () => {
    const voteInput: Partial<PostVote> = {
      postId: post.id,
      upvoted: true
    };

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}/vote`)
      .set('Cookie', userCookie)
      .send(voteInput)
      .expect(200);
  });

  it('should not allow people outside the space to vote on a forum post, responding with 200', async () => {
    const { user: outsideUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const outsideUserCookie = await loginUser(outsideUser.id);

    const voteInput: Partial<PostVote> = {
      postId: post.id,
      upvoted: true
    };

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}/vote`)
      .set('Cookie', outsideUserCookie)
      .send(voteInput)
      .expect(401);
  });
});
