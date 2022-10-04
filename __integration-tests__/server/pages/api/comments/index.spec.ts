/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';

import type { CommentCreate, CommentWithUser } from 'lib/comments';
import { upsertPermission } from 'lib/permissions/pages';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateCommentWithThreadAndPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: LoggedInUser;
let adminUserSpace: Space;
let adminCookie: string;

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);

  const second = await generateUserAndSpaceWithApiToken();

  adminUser = second.user;
  adminUserSpace = second.space;
  adminCookie = await loginUser(adminUser.id);
});

describe('POST /api/comments - create a comment', () => {

  it('should succeed if the user has a comment permission, returning the comment and author, and respond 201', async () => {

    const { thread, page } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await upsertPermission(page.id, {
      permissionLevel: 'view_comment',
      pageId: page.id,
      userId: nonAdminUser.id
    });

    const creationContent: Omit<CommentCreate, 'userId'> = {
      content: 'New',
      threadId: thread.id
    };

    const createdComment = (await request(baseUrl)
      .post('/api/comments')
      .set('Cookie', nonAdminCookie)
      .send(creationContent)
      .expect(201)).body as CommentWithUser;

    expect(createdComment).toEqual(
      expect.objectContaining<Partial<CommentWithUser>>({
        content: creationContent.content,
        pageId: page.id
      })
    );

    expect(createdComment.user).toBeDefined();
    expect(createdComment.user.id).toBe(nonAdminUser.id);

  });

  it('should fail if the user does not have a comment permission, even if they are an admin, and respond 401', async () => {
    const { thread, page } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: adminUserSpace.id,
      userId: adminUser.id
    });

    const creationContent: Omit<CommentCreate, 'userId'> = {
      content: 'New',
      threadId: thread.id
    };

    await request(baseUrl)
      .post('/api/comments')
      .set('Cookie', nonAdminCookie)
      .send(creationContent)
      .expect(401);

  });

});
