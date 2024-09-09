/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import {
  generateCommentWithThreadAndPage,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

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

describe('PUT /api/threads/{id} - update a comment', () => {
  it('should update the thread status if the user has the comment permissions, and respond 200', async () => {
    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await prisma.pagePermission.create({
      data: {
        permissionLevel: 'view_comment',
        user: { connect: { id: nonAdminUser.id } },
        page: { connect: { id: page.id } }
      }
    });

    await request(baseUrl)
      .put(`/api/threads/${thread.id}/resolve`)
      .set('Cookie', nonAdminCookie)
      .send({ resolved: true })
      .expect(200);
  });

  it('should fail if the user does not have comment permission and respond 401', async () => {
    const otherAdminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: false
    });

    const otherAdminCookie = await loginUser(otherAdminUser.id);

    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl)
      .put(`/api/threads/${thread.id}/resolve`)
      .set('Cookie', otherAdminCookie)
      .send({ resolved: true })
      .expect(401);
  });
});

describe('DELETE /api/threads/{id} - delete a thread', () => {
  it('should delete the thread if the user has comment permissions it, and respond 200', async () => {
    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await prisma.pagePermission.create({
      data: {
        permissionLevel: 'view_comment',
        user: { connect: { id: nonAdminUser.id } },
        page: { connect: { id: page.id } }
      }
    });

    await request(baseUrl).delete(`/api/threads/${thread.id}`).set('Cookie', nonAdminCookie).expect(200);

    const inexistentThread = await prisma.thread.findUnique({
      where: {
        id: thread.id
      }
    });

    expect(inexistentThread).toBeNull();
  });

  it('should fail if the user did not create the thread, and respond 401', async () => {
    const otherAdminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: false
    });

    const otherAdminCookie = await loginUser(otherAdminUser.id);

    const { thread } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl).delete(`/api/threads/${thread.id}`).set('Cookie', otherAdminCookie).expect(401);
  });
});
