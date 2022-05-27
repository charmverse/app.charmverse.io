/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bounty, Prisma, Space, User } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createBounty } from 'lib/bounties';
import { BountyWithDetails } from '../../../../../../models';

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
  nonAdminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: nonAdminUser.addresses[0]
    })).headers['set-cookie'][0];

  const second = await generateUserAndSpaceWithApiToken();

  adminUser = second.user;
  adminUserSpace = second.space;
  adminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: adminUser.addresses[0]
    })).headers['set-cookie'][0];
});

describe('PUT /api/bounties/{bountyId} - update a bounty', () => {

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

    const randomSpaceUserCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: randomSpaceUser.addresses[0]
      })).headers['set-cookie'][0];

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

  it('should allow the creator to edit only the bounty title and description if it is in suggestion status and respond with 200', async () => {

    const bountyCreator = await generateSpaceUser({
      isAdmin: false,
      spaceId: nonAdminUserSpace.id
    });

    const bountyCreatorCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: bountyCreator.addresses[0]
      })).headers['set-cookie'][0];

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: bountyCreator.id,
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion'
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

  it('should not allow the creator to edit the bounty if it has gone past suggestion status and respond with 401', async () => {

    const bountyCreator = await generateSpaceUser({
      isAdmin: false,
      spaceId: nonAdminUserSpace.id
    });

    const bountyCreatorCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: bountyCreator.addresses[0]
      })).headers['set-cookie'][0];

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: bountyCreator.id,
      spaceId: nonAdminUserSpace.id,
      status: 'open',
      rewardAmount: 3
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
      .expect(401);
  });
});
