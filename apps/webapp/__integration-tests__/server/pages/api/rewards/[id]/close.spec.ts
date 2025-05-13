import type { User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBounty } from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';

describe('POST /api/rewards/:id/close - close a reward', () => {
  let admin: User;
  let space: any;

  let userCookie: string;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    admin = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userCookie = await loginUser(admin.id);
  });

  it('should successfully close the reward with a status code 200 if the admin has permission', async () => {
    const reward = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id,
      status: 'open'
    });

    const response = await request(baseUrl)
      .post(`/api/rewards/${reward.id}/close`)
      .set('Cookie', userCookie)
      .expect(200);

    const returnedReward: RewardWithUsers = response.body;
    expect(returnedReward.status).toBe('complete');
  });

  it('should return a 401 status code with an UnauthorisedActionError if the admin does not have permission', async () => {
    const otherUser = await testUtilsUser.generateUser();
    const otherUserCookie = await loginUser(otherUser.id);
    const reward = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id,
      status: 'open'
    });

    await request(baseUrl).post(`/api/rewards/${reward.id}/close`).set('Cookie', otherUserCookie).expect(401);
  });

  it('should return an error with a status code 404 if the reward/page is not found', async () => {
    const nonExistentRewardId = 'some-non-existent-id'; // or generate an ID that doesn't correspond to a created reward.

    await request(baseUrl).post(`/api/rewards/${uuid()}/close`).set('Cookie', userCookie).expect(404);
  });
});
