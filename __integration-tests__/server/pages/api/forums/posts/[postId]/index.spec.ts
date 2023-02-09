/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';
import type { UpdateForumPostInput } from 'lib/forums/posts/updateForumPost';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import {
  generateRole,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

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
  const { space: _space, user: _user } = await generateUserAndSpace({ isAdmin: false });

  space = _space;
  user = _user;
  userCookie = await loginUser(user.id);
  adminUser = await generateSpaceUser({ isAdmin: true, spaceId: space.id });
  adminUserCookie = await loginUser(adminUser.id);

  postCategory = await generatePostCategory({
    name: 'Test Category',
    spaceId: space.id
  });

  await upsertPostCategoryPermission({
    assignee: { group: 'space', id: space.id },
    permissionLevel: 'view',
    postCategoryId: postCategory.id
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
  it('should fail to update the post if the user did not create it even if they are an admin, responding with 401', async () => {
    const post = await generateForumPost(createInput);

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}`)
      .set('Cookie', adminUserCookie)
      .send(updateInput)
      .expect(401);
  });

  it('should fail to update the post to a new category if the author cannot create posts in that category, responding with 401', async () => {
    const post = await generateForumPost(createInput);

    const unauthorisedCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Unauthorised category'
    });

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}`)
      .set('Cookie', adminUserCookie)
      .send({
        ...updateInput,
        categoryId: unauthorisedCategory.id
      } as UpdateForumPostInput)
      .expect(401);
  });
});
describe('DELETE /api/forums/posts/[postId] - Delete a post', () => {
  it('should delete a post if the user created it, responding with 200', async () => {
    const post = await generateForumPost(createInput);

    await request(baseUrl).delete(`/api/forums/posts/${post.id}`).set('Cookie', userCookie).send().expect(200);

    const postAfterDelete = await prisma.post.findUnique({
      where: {
        id: post.id
      }
    });

    expect(postAfterDelete?.deletedAt).toBeDefined();
  });

  it('should delete a post if the user has the permissions for this, responding with 200', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: adminUser.id,
      assigneeUserIds: [extraSpaceUser.id]
    });

    const moderatedPostCategory = await prisma.postCategory.create({
      data: {
        name: 'Moderated category',
        space: { connect: { id: space.id } },
        postCategoryPermissions: {
          create: {
            permissionLevel: 'moderator',
            role: { connect: { id: role.id } }
          }
        }
      }
    });

    const post = await generateForumPost({
      ...createInput,
      categoryId: moderatedPostCategory.id
    });
    await request(baseUrl)
      .delete(`/api/forums/posts/${post.id}`)
      .set('Cookie', extraSpaceUserCookie)
      .send()
      .expect(200);

    const postAfterDelete = await prisma.post.findUnique({
      where: {
        id: post.id
      }
    });

    expect(postAfterDelete?.deletedAt).toBeDefined();
  });

  it('should fail to delete the post if the user does not have permissions to do so in this category, responding with 401', async () => {
    const page = await generateForumPost(createInput);

    await request(baseUrl)
      .delete(`/api/forums/posts/${page.id}`)
      .set('Cookie', extraSpaceUserCookie)
      .send()
      .expect(401);
  });
});
describe('GET /api/forums/posts/[postId] - Get a post', () => {
  it('should return a post if the user has permissions for this category, responding with 200', async () => {
    const post = await generateForumPost(createInput);

    const retrievedPost = (
      await request(baseUrl).get(`/api/forums/posts/${post.id}`).set('Cookie', userCookie).send().expect(200)
    ).body as PostWithVotes;

    // The retrieved post will have votes data, which the original generated post will not have
    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<PostWithVotes>>({
        id: post.id,
        categoryId: post.categoryId,
        spaceId: post.spaceId,
        content: post.content,
        title: post.title,
        contentText: post.contentText,
        path: post.path,
        locked: post.locked,
        pinned: post.pinned,
        votes: {
          downvotes: 0,
          upvotes: 0,
          upvoted: null
        }
      })
    );
  });
  it('should fail to return the post if the user does not have permissions for this category, responding with 401', async () => {
    const { user: externalUser } = await generateUserAndSpaceWithApiToken();
    const externalUserCookie = await loginUser(externalUser.id);

    const post = await generateForumPost(createInput);

    await request(baseUrl).get(`/api/forums/posts/${post.id}`).set('Cookie', externalUserCookie).send().expect(401);
  });
});
