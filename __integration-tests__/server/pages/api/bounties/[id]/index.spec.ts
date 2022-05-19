/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bounty, Prisma, Space, User } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createBounty } from 'lib/bounties';

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

describe('PUT /api/bounties - update a bounty', () => {

  it('should ignore irrelevant bounty fields and succeed with the update', async () => {

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

  it('should reject an update attempt from a non admin user', async () => {

    const createdBounty = await createBounty({
      title: 'Example',
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion'
    });

    const updateContent: Partial<Bounty> = {
      rewardAmount: 10,
      rewardToken: 'BNB'
    };

    await request(baseUrl)
      .put(`/api/bounties/${createdBounty.id}`)
      .set('Cookie', nonAdminCookie)
      .send(updateContent)
      .expect(401);

  });
});
