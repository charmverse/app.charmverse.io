/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@charmverse/core/prisma';
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

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);

  const second = await generateUserAndSpaceWithApiToken();
});

describe('PUT /api/comments/{id} - update a comment', () => {
  it('should update the comment if the user created it, and respond 200', async () => {
    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl)
      .put(`/api/comments/${comment.id}`)
      .set('Cookie', nonAdminCookie)
      .send({ content: [] })
      .expect(200);
  });

  it('should fail if the user did not create the comment, and respond 401', async () => {
    const otherAdminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: true
    });

    const otherAdminCookie = await loginUser(otherAdminUser.id);

    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl)
      .put(`/api/comments/${comment.id}`)
      .set('Cookie', otherAdminCookie)
      .send({ content: [] })
      .expect(401);
  });
});

describe('DELETE /api/comments/{id} - delete a comment', () => {
  it('should delete the comment if the user created it, and respond 200', async () => {
    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl).delete(`/api/comments/${comment.id}`).set('Cookie', nonAdminCookie).expect(200);
  });

  it('should fail if the user did not create the comment, and respond 401', async () => {
    const otherAdminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: true
    });

    const otherAdminCookie = await loginUser(otherAdminUser.id);

    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl).delete(`/api/comments/${comment.id}`).set('Cookie', otherAdminCookie).expect(401);
  });
});
