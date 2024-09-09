/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, Thread, User } from '@charmverse/core/prisma';
import { testUtilsPages } from '@charmverse/core/test';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';

import type { ThreadCreatePayload, ThreadWithComments } from 'lib/threads';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

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

describe('POST /api/threads - create a thread', () => {
  it('should succeed if the user has a comment permission, and respond 201', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      pagePermissions: [
        {
          permissionLevel: 'view_comment',
          assignee: {
            group: 'user',
            id: nonAdminUser.id
          }
        }
      ]
    });

    const creationContent: Omit<ThreadCreatePayload, 'userId'> = {
      comment: 'My comment',
      context: 'context',
      pageId: page.id
    };

    const createdThread = (
      await request(baseUrl).post('/api/threads').set('Cookie', nonAdminCookie).send(creationContent).expect(201)
    ).body as ThreadWithComments;

    expect(createdThread).toEqual(
      expect.objectContaining<Partial<Thread>>({
        context: creationContent.context,
        pageId: creationContent.pageId
      })
    );

    expect(createdThread.comments).toBeDefined();
    expect(createdThread.comments[0].content).toBe(creationContent.comment);
    expect(createdThread.comments[0].userId).toBe(nonAdminUser.id);
  });

  it('should fail if the user does not have a comment permission, and respond 401', async () => {
    const page = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    const creationContent: Omit<ThreadCreatePayload, 'userId'> = {
      comment: 'My comment',
      context: 'context',
      pageId: page.id
    };

    await request(baseUrl).post('/api/threads').set('Cookie', nonAdminCookie).send(creationContent).expect(401);
  });
});
