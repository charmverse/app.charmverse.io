/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Application, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsRandom, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import { createBounty } from 'lib/bounties';
import type { WorkUpsertData } from 'lib/rewards/work';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty } from 'testing/setupDatabase';

describe('PUT /api/rewards/:id/work - work on a reward', () => {
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
    const reward = await createBounty({
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
        .put(`/api/rewards/${reward.id}/work`)
        .set('Cookie', userCookie)
        .send(workContent)
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
        .put(`/api/rewards/${reward.id}/work?applicationId=${createdApplication.id}`)
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
    const reward = await createBounty({
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
      walletAddress: testUtilsRandom.randomETHWallet().address
    };

    // Case where this works
    const memberWithRoleCookie = await loginUser(memberWithRole.id);

    await request(baseUrl)
      .put(`/api/rewards/${reward.id}/work`)
      .set('Cookie', memberWithRoleCookie)
      .send(workContent)
      .expect(200);

    await request(baseUrl)
      .put(`/api/rewards/${reward.id}/work`)
      .set('Cookie', userCookie)
      .send(workContent)
      .expect(401);
  });

  it('it should prevent a user without permissions from working on this reward, and respond with 401', async () => {
    const reward = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1
    });

    const workContent = {
      // ... data necessary to "work" on the reward.
    };

    const otherUser = await testUtilsUser.generateUser();
    const otherUserCookie = await loginUser(otherUser.id);

    await request(baseUrl)
      .put(`/api/rewards/${reward.id}/work`)
      .set('Cookie', otherUserCookie)
      .send(workContent)
      .expect(401);
  });
});
