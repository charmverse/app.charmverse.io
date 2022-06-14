/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bounty, Prisma, Space, Thread, User } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { createPage, generateUserAndSpaceWithApiToken, generateCommentWithThreadAndPage } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createBounty } from 'lib/bounties';
import { ThreadCreate, ThreadWithCommentsAndAuthors } from 'lib/threads';
import { upsertPermission } from 'lib/permissions/pages';
import { CommentCreate, CommentWithUser } from 'lib/comments';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: User;
let adminUserSpace: Space;
let adminCookie: string;

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: nonAdminUser.addresses[0]
    })).headers['set-cookie'][0];

  const second = await generateUserAndSpaceWithApiToken();

  adminUser = second.user;
  adminUserSpace = second.space;
  adminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: adminUser.addresses[0]
    })).headers['set-cookie'][0];
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
