import type { Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBounty } from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { Reward } from '@packages/lib/rewards/interfaces';

describe('POST /api/rewards-applications/review - review user application', () => {
  let space: Space;
  let admin: User;
  let adminCookie: string;
  let rewardCreator: User;
  let rewardCreatorCookie: string;
  let user: User;
  let userCookie: string;
  let reward: Reward;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;

    admin = generated.user;
    adminCookie = await loginUser(admin.id);

    rewardCreator = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    rewardCreatorCookie = await loginUser(rewardCreator.id);

    user = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userCookie = await loginUser(user.id);

    reward = await generateBounty({
      createdBy: rewardCreator.id,
      spaceId: space.id,
      status: 'open'
    });
  });

  it('should allow user with permissions to approve an application and receive a status code 200', async () => {
    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        bountyId: reward.id,
        createdBy: user.id
      }
    });

    await request(baseUrl)
      .post(`/api/reward-applications/review?applicationId=${application.id}`)
      .set('Cookie', rewardCreatorCookie)
      .send({ decision: 'approve' })
      .expect(200);
  });

  it('should allow user with permissions to reject an application and receive a status code 200', async () => {
    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        bountyId: reward.id,
        createdBy: user.id
      }
    });

    await request(baseUrl)
      .post(`/api/reward-applications/review?applicationId=${application.id}`)
      .set('Cookie', adminCookie)
      .send({ decision: 'reject' })
      .expect(200);
  });

  it('should prevent a user without permissions from reviewing an application and receive a status code 401', async () => {
    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        bountyId: reward.id,
        createdBy: user.id
      }
    });

    await request(baseUrl)
      .post(`/api/reward-applications/review?applicationId=${application.id}`)
      .set('Cookie', userCookie)
      .send({ decision: 'approve' })
      .expect(401);
  });

  it('should respond with 404 if application ID provided does not exist', async () => {
    await request(baseUrl)
      .post(`/api/reward-applications/review?applicationId=${uuid()}`)
      .set('Cookie', userCookie)
      .send({ decision: 'approve' })
      .expect(404);
  });
});
