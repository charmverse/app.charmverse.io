import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { Space, User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('GET /api/rewards - getBounties', () => {
  let user: User;
  let space: Space;
  let userCookie: string;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    user = generated.user;
    space = generated.space;
    userCookie = await loginUser(user.id);
  });

  it('should return a list of rewards with a status code 200 when the user has permission', async () => {
    const response = await request(baseUrl)
      .get(`/api/rewards?spaceId=${space.id}`)
      .set('Cookie', userCookie)
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('id');
  });

  it('should return a status code 401 when a non-logged-in user tries to access without publicOnly flag', async () => {
    await request(baseUrl).get(`/api/rewards?spaceId=${space.id}`).expect(401);
  });

  it('should return a list of public rewards with a status code 200 for non-logged-in users when the publicOnly flag is true', async () => {
    const response = await request(baseUrl).get(`/api/rewards?spaceId=${space.id}`).expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('id');
  });
});

describe('POST /api/rewards - createRewardController', () => {
  let user: User;
  let space: Space;
  let userCookie: string;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    user = generated.user;
    space = generated.space;
    userCookie = await loginUser(user.id);
  });

  it('should create a reward and return it with a status code 201 when the user has the permission', async () => {
    const reviewers: TargetPermissionGroup<'role' | 'user'>[] = [{ id: user.id, group: 'user' }];
    const submitterRole = await testUtilsMembers.generateRole({ createdBy: user.id, spaceId: space.id });

    const rewardData: Partial<RewardCreationData> = {
      spaceId: space.id,
      userId: user.id,
      chainId: 2,
      rewardAmount: 100,
      rewardToken: 'ETH',
      approveSubmitters: true,
      maxSubmissions: 10,
      dueDate: new Date(),
      customReward: 'Special Badge',
      fields: { fieldName: 'sampleField', type: 'text' },
      reviewers,
      allowedSubmitterRoles: [submitterRole.id]
    };

    const response = (
      await request(baseUrl).post(`/api/rewards`).set('Cookie', userCookie).send(rewardData).expect(201)
    ).body as RewardWithUsers;

    expect(response).toMatchObject<Partial<RewardWithUsers>>({
      spaceId: space.id,
      createdBy: user.id,
      applications: [],
      allowedSubmitterRoles: rewardData.allowedSubmitterRoles,
      reviewers
    });
  });

  it('should return a status code 401 when the user does not have permission to create a reward', async () => {
    const anotherUser = await testUtilsUser.generateUser(); // Assuming this user doesn't have permission to create a reward.
    const anotherUserCookie = await loginUser(anotherUser.id);

    const rewardData = {
      spaceId: space.id,
      title: 'Random Text',
      description: 'Random Text'
      // ... other required properties for reward
    };

    await request(baseUrl)
      .post(`/api/rewards?spaceId=${space.id}`)
      .set('Cookie', anotherUserCookie)
      .send(rewardData)
      .expect(401);
  });
});
