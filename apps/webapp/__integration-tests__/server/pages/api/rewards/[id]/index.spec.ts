import type { Space, User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBounty } from '@packages/testing/setupDatabase';
import request from 'supertest';

import type { RewardWithUsersAndPageMeta } from '@packages/lib/rewards/interfaces';

describe('GET /api/rewards/:id - get reward details', () => {
  let space: Space;
  let user: User;
  let userCookie: string;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    user = generated.user;
    userCookie = await loginUser(user.id);
  });

  it('should return the reward with a status code of 200 if the user has permission to view the reward', async () => {
    const { sourceProposalPage, ...reward } = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    const rewardFromApi = (
      await request(baseUrl).get(`/api/rewards/${reward.id}`).set('Cookie', userCookie).expect(200)
    ).body as RewardWithUsersAndPageMeta;

    expect(rewardFromApi).toMatchObject<RewardWithUsersAndPageMeta>({
      ...reward,
      reviewers: [],
      allowedSubmitterRoles: null,
      assignedSubmitters: null,
      updatedAt: expect.any(String),
      createdAt: expect.any(String),
      page: {
        id: expect.any(String),
        path: expect.any(String),
        title: expect.any(String)
      }
    });
  });

  it('should return a status code of 401 if the user does not have permission to view the reward', async () => {
    const otherUser = await testUtilsUser.generateUser();
    const otherUserCookie = await loginUser(otherUser.id);

    const reward = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    await request(baseUrl).get(`/api/rewards/${reward.id}`).set('Cookie', otherUserCookie).expect(401);
  });
});

describe('PUT /api/rewards/:id - update reward details', () => {
  let space: Space;
  let user: User;
  let userCookie: string;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    user = generated.user;
    userCookie = await loginUser(user.id);
  });

  it('should return the updated reward with a status code of 200 if the user has permission to edit the reward', async () => {
    const reward = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    const updateContent = {
      title: 'Updated Title'
    };

    await request(baseUrl).put(`/api/rewards/${reward.id}`).set('Cookie', userCookie).send(updateContent).expect(200);
  });

  it('should return a status code of 401 if the user does not have permission to edit the reward', async () => {
    const otherUser = await testUtilsUser.generateUser();
    const otherUserCookie = await loginUser(otherUser.id);

    const reward = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    const updateContent = {
      title: 'Updated Title'
    };

    await request(baseUrl)
      .put(`/api/rewards/${reward.id}`)
      .set('Cookie', otherUserCookie)
      .send(updateContent)
      .expect(401);
  });
});
