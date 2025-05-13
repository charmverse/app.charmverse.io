import { prisma, type Space, type User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBounty } from '@packages/testing/setupDatabase';
import request from 'supertest';

import type { RewardCreationData } from '@packages/lib/rewards/createReward';
import { getRewardOrThrow } from '@packages/lib/rewards/getReward';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';

describe('GET /api/rewards - getRewards', () => {
  let user: User;
  let user2: User;
  let admin: User;
  let space: Space;
  let userCookie: string;
  let user2Cookie: string;
  let reward: RewardWithUsers;
  let draftReward: RewardWithUsers;
  let hiddenReward: RewardWithUsers;
  let publicReward: RewardWithUsers;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true, publicBountyBoard: true });
    admin = generated.user;
    space = generated.space;
    user = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
    user2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

    userCookie = await loginUser(user.id);
    user2Cookie = await loginUser(user2.id);

    const { id: hiddenRewardId } = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id
    });

    const { id: rewardId } = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id,
      pagePermissions: [{ permissionLevel: 'view_comment', spaceId: space.id }]
    });

    const { id: draftRewardId } = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'draft',
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          userId: user.id
        }
      ]
    });

    const { id: publicRewardId } = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id,
      pagePermissions: [{ permissionLevel: 'view', public: true }]
    });

    // Make a public reward
    reward = await getRewardOrThrow({ rewardId });
    draftReward = await getRewardOrThrow({ rewardId: draftRewardId });
    hiddenReward = await getRewardOrThrow({ rewardId: hiddenRewardId });
    publicReward = await getRewardOrThrow({ rewardId: publicRewardId });
  });

  it('should provide space members with a list of rewards they can view and respond with a status code 200', async () => {
    const response = (
      await request(baseUrl).get(`/api/rewards?spaceId=${space.id}`).set('Cookie', userCookie).expect(200)
    ).body as RewardWithUsers[];

    expect(response).toHaveLength(3);

    expect(response).toEqual(
      expect.arrayContaining([
        { ...reward, createdAt: expect.any(String), updatedAt: expect.any(String) },
        { ...draftReward, createdAt: expect.any(String), updatedAt: expect.any(String) },
        { ...publicReward, createdAt: expect.any(String), updatedAt: expect.any(String) }
      ])
    );
  });

  it('should return accessible rewards for space member without draft rewards from other space members and respond with a status code 200', async () => {
    const response = (
      await request(baseUrl).get(`/api/rewards?spaceId=${space.id}`).set('Cookie', user2Cookie).expect(200)
    ).body as RewardWithUsers[];

    expect(response).toHaveLength(2);

    expect(response).toEqual(
      expect.arrayContaining([
        { ...reward, createdAt: expect.any(String), updatedAt: expect.any(String) },
        { ...publicReward, createdAt: expect.any(String), updatedAt: expect.any(String) }
      ])
    );
  });

  it('should return a list of public rewards with a status code 200 for non-logged-in users if the space uses public rewards', async () => {
    const response = (await request(baseUrl).get(`/api/rewards?spaceId=${space.id}`).expect(200))
      .body as RewardWithUsers[];

    expect(response).toHaveLength(1);

    expect(response).toEqual([{ ...publicReward, createdAt: expect.any(String), updatedAt: expect.any(String) }]);
  });

  it('should return a status code 401 if a person outside the space requests rewards and the space has turned off public rewards board setting', async () => {
    const { space: spaceWithoutPublicRewards } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      publicBountyBoard: false
    });
    await request(baseUrl).get(`/api/rewards?spaceId=${spaceWithoutPublicRewards.id}`).expect(401);
  });
});

describe('POST /api/rewards - createRewardController', () => {
  let user: User;
  let space: Space;
  let userCookie: string;

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: false }));
    await prisma.spacePermission.create({
      data: {
        space: { connect: { id: space.id } },
        forSpace: { connect: { id: space.id } },
        operations: ['createBounty']
      }
    });
    userCookie = await loginUser(user.id);
  });

  it('should create a reward and return it with a status code 201 when the user has the permission', async () => {
    const reviewers = [{ userId: user.id }];
    const submitterRole = await testUtilsMembers.generateRole({ createdBy: user.id, spaceId: space.id });

    const rewardData: RewardCreationData = {
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
      pageProps: {
        title: 'Some reward'
      },
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

  it('should return a status code 400 when missing fields', async () => {
    const anotherUser = await testUtilsUser.generateUser(); // Assuming this user doesn't have permission to create a reward.
    const anotherUserCookie = await loginUser(anotherUser.id);

    const rewardData = {
      spaceId: space.id,
      title: 'Random Text',
      description: 'Random Text'
    };

    await request(baseUrl)
      .post(`/api/rewards?spaceId=${space.id}`)
      .set('Cookie', userCookie)
      .send(rewardData)
      .expect(400);
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
