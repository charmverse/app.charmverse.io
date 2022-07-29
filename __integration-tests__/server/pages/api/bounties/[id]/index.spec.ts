/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bounty, Space, User } from '@prisma/client';
import { createBounty } from 'lib/bounties';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import { BountyWithDetails } from 'models';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: User;
let adminUserSpace: Space;
let adminCookie: string;

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = await loginUser(nonAdminUser);

  const second = await generateUserAndSpaceWithApiToken();

  adminUser = second.user;
  adminUserSpace = second.space;
  adminCookie = await loginUser(adminUser);
});

describe('PUT /api/bounties/{bountyId} - update a bounty', () => {

  it('should allow a user with the edit permission to update the bounty and respond with 200', async () => {

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'open',
      rewardAmount: 5,
      chainId: 1,
      rewardToken: 'ETH'
    });

    await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: nonAdminUser.id
      },
      // Creators can edit their bounties
      level: 'creator',
      resourceId: createdBounty.id
    });

    const updateContent: Partial<Bounty> = {
      rewardAmount: 10,
      rewardToken: 'BNB'
    };

    const response = await request(baseUrl)
      .put(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', nonAdminCookie)
      .send(updateContent)
      .expect(200);

    const updatedBounty = response.body as Bounty;

    expect(updatedBounty.rewardAmount).toBe(updateContent.rewardAmount);
    expect(updatedBounty.rewardToken).toBe(updateContent.rewardToken);

  });

  it('should ignore irrelevant bounty fields and succeed with the update and respond with 200', async () => {

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: adminUser.id,
      spaceId: adminUserSpace.id,
      status: 'open',
      rewardAmount: 5,
      chainId: 1,
      rewardToken: 'ETH'
    });

    const updateContent: Partial<Bounty> = {
      rewardAmount: 10,
      rewardToken: 'BNB',
      ...{
        randomField: 2,
        anotherWrongField: 'some text'
      } as any
    };

    const response = await request(baseUrl)
      .put(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200);

    const updatedBounty = response.body as Bounty;

    expect(updatedBounty.rewardAmount).toBe(updateContent.rewardAmount);
    expect(updatedBounty.rewardToken).toBe(updateContent.rewardToken);

  });

  it('should reject an update attempt from a non admin user who did not create the bounty and respond with 401', async () => {

    const randomSpaceUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: nonAdminUserSpace.id
    });

    const randomSpaceUserCookie = await loginUser(randomSpaceUser);

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: adminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion'
    });

    const updateContent: Partial<Bounty> = {
      rewardAmount: 10,
      rewardToken: 'BNB'
    };

    await request(baseUrl)
      .put(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', randomSpaceUserCookie)
      .send(updateContent)
      .expect(401);

  });

  // This needs to be updated.
  it.skip('should allow the creator to edit only the bounty title and description if it is in suggestion status and respond with 200', async () => {

    const bountyCreator = await generateSpaceUser({
      isAdmin: false,
      spaceId: nonAdminUserSpace.id
    });

    const bountyCreatorCookie = await loginUser(bountyCreator);

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: bountyCreator.id,
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion'
    });

    await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: bountyCreator.id
      },
      level: 'creator',
      resourceId: createdBounty.id
    });

    const updateContent: Partial<Bounty> = {
      title: 'New title to set',
      descriptionNodes: '{}',
      rewardAmount: 10,
      rewardToken: 'BNB'
    };

    const updated = (await request(baseUrl)
      .put(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', bountyCreatorCookie)
      .send(updateContent)
      .expect(200)).body as BountyWithDetails;

    expect(updated.title).toBe(updateContent.title);
    expect(updated.descriptionNodes).toBe(updateContent.descriptionNodes);
    // Reward amount was dropped
    expect(updated.rewardAmount).toBe(createdBounty.rewardAmount);
  });

  it('should allow the creator to edit the whole bounty if it has gone past suggestion status and respond with 200', async () => {

    const bountyCreator = await generateSpaceUser({
      isAdmin: false,
      spaceId: nonAdminUserSpace.id
    });

    const bountyCreatorCookie = await loginUser(bountyCreator);

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: bountyCreator.id,
      spaceId: nonAdminUserSpace.id,
      status: 'open',
      rewardAmount: 3
    });

    await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: bountyCreator.id
      },
      level: 'creator',
      resourceId: createdBounty.id
    });

    const updateContent: Partial<Bounty> = {
      title: 'New title to set',
      descriptionNodes: '{}',
      rewardAmount: 10,
      rewardToken: 'BNB'
    };

    await request(baseUrl)
      .put(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', bountyCreatorCookie)
      .send(updateContent)
      .expect(200);
  });
});

describe('DELETE /api/bounties/{bountyId} - delete a bounty', () => {

  it('should allow admins to delete a bounty and respond with 200', async () => {

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: adminUser.id,
      spaceId: adminUserSpace.id,
      status: 'open',
      rewardAmount: 5,
      chainId: 1,
      rewardToken: 'ETH'
    });

    request(baseUrl)
      .delete(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', adminCookie)
      .send({})
      .expect(200);

  });

  it('should allow the bounty creator to delete a bounty suggestion they created and respond with 200', async () => {

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      rewardAmount: 5,
      chainId: 1,
      rewardToken: 'ETH'
    });

    await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: nonAdminUser.id
      },
      level: 'creator',
      resourceId: createdBounty.id
    });

    request(baseUrl)
      .delete(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(200);

  });

  it('should allow the bounty creator to delete a bounty they created if it is open but has no submissions yet and respond with 200', async () => {

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'open',
      rewardAmount: 5,
      chainId: 1,
      rewardToken: 'ETH'
    });

    await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: nonAdminUser.id
      },
      level: 'creator',
      resourceId: createdBounty.id
    });

    request(baseUrl)
      .delete(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(200);

  });

  it('should not allow the bounty creator to delete a bounty they created if it has at least 1 in progress or higher submission and respond with 401', async () => {

    const createdBounty = await generateBountyWithSingleApplication({
      spaceId: nonAdminUserSpace.id,
      bountyCap: 19,
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      userId: nonAdminUser.id
    });

    await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: nonAdminUser.id
      },
      level: 'creator',
      resourceId: createdBounty.id
    });

    request(baseUrl)
      .delete(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(401);

  });

  it('should reject an update attempt from a non admin user who did not create the bounty and respond with 401', async () => {

    const randomSpaceUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: nonAdminUserSpace.id
    });

    const randomSpaceUserCookie = await loginUser(randomSpaceUser);

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: adminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion'
    });

    const updateContent: Partial<Bounty> = {
      rewardAmount: 10,
      rewardToken: 'BNB'
    };

    await request(baseUrl)
      .delete(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', randomSpaceUserCookie)
      .send({})
      .expect(401);

  });

  it('should fail if the bounty does not exist and respond with 404', async () => {

    request(baseUrl)
      .delete(`/api/bounties/${v4()}`)
      .set('Cookie', adminCookie)
      .send({})
      .expect(404);

  });

});
