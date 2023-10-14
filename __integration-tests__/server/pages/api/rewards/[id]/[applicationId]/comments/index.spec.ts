import type { Application, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { Reward } from 'lib/rewards/interfaces';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty } from 'testing/setupDatabase';

describe('POST /api/applications/:id/comments - create comment on an application', () => {
  let space: Space;
  let admin: User;
  let user: User;
  let userCookie: string;
  let reviewerUser: User;
  let reviewerUserCookie: string;
  let reward: Reward;
  let application: Application;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    admin = generated.user;
    user = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reviewerUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userCookie = await loginUser(user.id);
    reviewerUserCookie = await loginUser(reviewerUser.id);
    reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      bountyPermissions: { reviewer: [{ group: 'user', id: reviewerUser.id }] }
    });
    application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: user.id,
        bountyId: reward.id
      }
    });
  });

  it('should allow a reward reviewer or the creator of the submission to create a comment with status code 201', async () => {
    const commentContent = {
      contentText: 'This is a comment'
      // Add other necessary data
    };

    await request(baseUrl)
      .post(`/api/rewards/${reward.id}/${application.id}/comments`)
      .set('Cookie', userCookie)
      .send(commentContent)
      .expect(201);

    await request(baseUrl)
      .post(`/api/rewards/${reward.id}/${application.id}/comments`)
      .set('Cookie', reviewerUserCookie)
      .send(commentContent)
      .expect(201);
  });

  it('should not allow a user who is neither a reward reviewer nor the creator to create a comment and respond with 401', async () => {
    const otherUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    const otherUserCookie = await loginUser(otherUser.id);

    const commentContent = {
      contentText: 'This is another comment'
      // Add other necessary data
    };

    await request(baseUrl)
      .post(`/api/rewards/${reward.id}/${application.id}/comments`)
      .set('Cookie', otherUserCookie)
      .send(commentContent)
      .expect(401);
  });
});

describe('GET /api/applications/:id/comments - fetch comments of an application', () => {
  let space: Space;
  let admin: User;
  let user: User;
  let userCookie: string;
  let reward: Reward;
  let application: Application;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    admin = generated.user;
    user = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userCookie = await loginUser(user.id);
    reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id
    });
    application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: admin.id,
        bountyId: reward.id
      }
    });
  });

  it('should allow a user with access to the space to fetch comments with status code 200', async () => {
    await request(baseUrl)
      .get(`/api/rewards/${reward.id}/${application.id}/comments`)
      .set('Cookie', userCookie)
      .expect(200);
  });

  it('should not allow a user without access to the space to fetch comments and respond with 401', async () => {
    const otherUser = await testUtilsUser.generateUser();
    const otherUserCookie = await loginUser(otherUser.id);

    await request(baseUrl)
      .get(`/api/rewards/${reward.id}/${application.id}/comments`)
      .set('Cookie', otherUserCookie)
      .expect(401);
  });
});
