/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Comment, Space, User } from '@charmverse/core/prisma';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import type { CommentCreate } from 'lib/comments';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: User;
let adminUserSpace: Space;
let adminCookie: string;

beforeAll(async () => {
  const first = await testUtilsUser.generateUserAndSpace({
    isAdmin: false
  });

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);

  const second = await testUtilsUser.generateUserAndSpace();

  adminUser = second.user;
  adminUserSpace = second.space;
  adminCookie = await loginUser(adminUser.id);
});

describe('POST /api/comments - create a comment', () => {
  it('should succeed if the user has a comment permission, returning the comment and author, and respond 201', async () => {
    const { thread, page } = await testUtilsPages.generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id,
      pagePermissions: [
        {
          permissionLevel: 'view_comment',
          assignee: { group: 'user', id: nonAdminUser.id }
        }
      ]
    });

    const creationContent: Omit<CommentCreate, 'userId'> = {
      content: 'New',
      threadId: thread.id
    };

    const createdComment = (
      await request(baseUrl).post('/api/comments').set('Cookie', nonAdminCookie).send(creationContent).expect(201)
    ).body as Comment;

    expect(createdComment).toEqual(
      expect.objectContaining<Partial<Comment>>({
        content: creationContent.content,
        pageId: page.id
      })
    );

    expect(createdComment.userId).toBe(nonAdminUser.id);
  });

  it('should fail if the user does not have a comment permission, even if they are an admin, and respond 401', async () => {
    const { thread, page } = await testUtilsPages.generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: adminUserSpace.id,
      userId: adminUser.id
    });

    const creationContent: Omit<CommentCreate, 'userId'> = {
      content: 'New',
      threadId: thread.id
    };

    await request(baseUrl).post('/api/comments').set('Cookie', nonAdminCookie).send(creationContent).expect(401);
  });
});
