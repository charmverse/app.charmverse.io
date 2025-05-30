
api_test_example = """import type { Application, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsRandom, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { ApplicationWithTransactions, Reward } from 'lib/rewards/interfaces';
import type { WorkUpsertData } from 'lib/rewards/work';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBounty } from '@packages/testing/setupDatabase';

describe('PUT /api/reward-applications/work - work on a reward', () => {
  let space: Space;
  let admin: User;
  let user: User;
  let userCookie: string;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    admin = generated.user;
    user = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userCookie = await loginUser(user.id);
  });

  it('should allow user with permissions to create and update work, and receive their application with a 200', async () => {
    const reward = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1
    });

    const workContent: Partial<WorkUpsertData> = {
      message: 'Applying to work',
      submissionNodes: '',
      submission: '',
      rewardInfo: 'Fedex please',
      walletAddress: testUtilsRandom.randomETHWallet().address
    };

    const createdApplication = (
      await request(baseUrl)
        .put(`/api/reward-applications/work`)
        .set('Cookie', userCookie)
        .send({ ...workContent, rewardId: reward.id })
        .expect(200)
    ).body;

    expect(createdApplication).toMatchObject(expect.objectContaining<Partial<Application>>(workContent));

    const submissionUpdate: WorkUpsertData = {
      rewardId: reward.id,
      userId: user.id,
      submission: 'New content'
    };

    const updatedApplication = (
      await request(baseUrl)
        .put(`/api/reward-applications/work?applicationId=${createdApplication.id}`)
        .set('Cookie', userCookie)
        .send(submissionUpdate)
        .expect(200)
    ).body;

    expect(updatedApplication).toMatchObject(
      expect.objectContaining<Partial<Application>>({
        ...createdApplication,
        submission: submissionUpdate.submission
      })
    );
  });

  it('should only allow users with correct role to create work, if the reward is restricted to certain roles, and respond 200 or 401', async () => {
    const reward = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1
    });

    const memberWithRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const submitterRole = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id,
      assigneeUserIds: [memberWithRole.id]
    });

    await prisma.bountyPermission.create({
      data: {
        permissionLevel: 'submitter',
        bounty: { connect: { id: reward.id } },
        role: { connect: { id: submitterRole.id } }
      }
    });

    const workContent: Partial<WorkUpsertData> = {
      message: 'Applying to work',
      submissionNodes: '',
      submission: '',
      rewardInfo: 'Fedex please',
      walletAddress: testUtilsRandom.randomETHWallet().address,
      rewardId: reward.id
    };

    // Case where this works
    const memberWithRoleCookie = await loginUser(memberWithRole.id);

    await request(baseUrl)
      .put(`/api/reward-applications/work`)
      .set('Cookie', memberWithRoleCookie)
      .send(workContent)
      .expect(200);

    await request(baseUrl).put(`/api/reward-applications/work`).set('Cookie', userCookie).send(workContent).expect(401);
  });

  it('should prevent a user without permissions from working on this reward, and respond with 401', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1
    });

    const workContent = {
      rewardId: reward.id
    };

    const otherUser = await testUtilsUser.generateUser();
    const otherUserCookie = await loginUser(otherUser.id);

    await request(baseUrl)
      .put(`/api/reward-applications/work`)
      .set('Cookie', otherUserCookie)
      .send(workContent)
      .expect(401);
  });
});"""