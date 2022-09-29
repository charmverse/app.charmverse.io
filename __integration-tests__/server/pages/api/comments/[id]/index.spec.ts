/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl } from 'testing/mockApiCall';
import { generateCommentWithThreadAndPage, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import type { LoggedInUser } from 'models';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: nonAdminUser.wallets[0].address
    })).headers['set-cookie'][0];

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

    const otherAdminCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: otherAdminUser.wallets[0].address
      })).headers['set-cookie'][0];

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

    await request(baseUrl)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(200);
  });

  it('should fail if the user did not create the comment, and respond 401', async () => {

    const otherAdminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: true
    });

    const otherAdminCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: otherAdminUser.wallets[0].address
      })).headers['set-cookie'][0];

    const { thread, page, comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id
    });

    await request(baseUrl)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', otherAdminCookie)
      .send({})
      .expect(401);
  });

});
