/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bounty, Prisma, Space, Thread, User } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createBounty } from 'lib/bounties';
import { ThreadCreate, ThreadWithComments } from 'lib/threads';
import { upsertPermission } from '../../../../../lib/permissions/pages';

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

describe('POST /api/threads - create a thread', () => {

  it('should succeed if the user has a comment permission, and respond 201', async () => {

    const page = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    await upsertPermission(page.id, {
      permissionLevel: 'view_comment',
      pageId: page.id,
      userId: nonAdminUser.id
    });

    const creationContent: Omit<ThreadCreate, 'userId'> = {
      comment: 'My comment',
      context: 'context',
      pageId: page.id
    };

    const createdThread = (await request(baseUrl)
      .post('/api/threads')
      .set('Cookie', nonAdminCookie)
      .send(creationContent)
      .expect(201)).body as ThreadWithComments;

    expect(createdThread).toEqual(
      expect.objectContaining<Partial<Thread>>({
        context: creationContent.context,
        pageId: creationContent.pageId
      })
    );

    expect(createdThread.comments).toBeDefined();
    expect(createdThread.comments[0].content).toBe(creationContent.comment);

  });

  it('should fail if the user does not have a comment permission, and respond 401', async () => {
    const page = await createPage({
      createdBy: adminUser.id,
      spaceId: adminUserSpace.id
    });

    const creationContent: Omit<ThreadCreate, 'userId'> = {
      comment: 'My comment',
      context: 'context',
      pageId: page.id
    };

    await request(baseUrl)
      .post('/api/threads')
      .set('Cookie', adminCookie)
      .send(creationContent)
      .expect(401);

  });

});
