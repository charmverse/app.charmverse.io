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

describe('POST /api/bounties - create a bounty', () => {

  it('should allow admin users to create an open bounty, and respond 201', async () => {

    const creationContent: Partial<Bounty> = {
      title: 'Example',
      createdBy: adminUser.id,
      spaceId: adminUserSpace.id,
      status: 'open',
      rewardAmount: 5,
      chainId: 1,
      rewardToken: 'ETH'
    };

    const createdBounty = (await request(baseUrl)
      .post('/api/bounties')
      .set('Cookie', adminCookie)
      .send(creationContent)
      .expect(201)).body;

    expect(createdBounty).toEqual(
      expect.objectContaining<Partial<Bounty>>({
        title: creationContent.title,
        createdBy: adminUser.id,
        spaceId: adminUserSpace.id,
        status: creationContent.status,
        rewardAmount: creationContent.rewardAmount,
        chainId: creationContent.chainId,
        rewardToken: creationContent.rewardToken
      })
    );

  });

  it('should allow non-admin users to create a bounty suggestion, and respond 201', async () => {

    const creationContent: Partial<Bounty> = {
      title: 'Example',
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion'
    };

    const createdBounty = (await request(baseUrl)
      .post('/api/bounties')
      .set('Cookie', nonAdminCookie)
      .send(creationContent)
      .expect(201)).body;

    expect(createdBounty).toEqual(
      expect.objectContaining<Partial<Bounty>>({
        title: creationContent.title,
        createdBy: nonAdminUser.id,
        spaceId: nonAdminUserSpace.id,
        status: creationContent.status
      })
    );

  });

  it('should not allow non-admin users to create an open bounty, and respond 401', async () => {

    const creationContent: Partial<Bounty> = {
      title: 'Example',
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'open',
      rewardAmount: 5,
      chainId: 1,
      rewardToken: 'ETH'
    };

    await request(baseUrl)
      .post('/api/bounties')
      .set('Cookie', adminCookie)
      .send(creationContent)
      .expect(401);
  });

  it('should not allow users to create a bounty in a space they are not a member of, and respond 401', async () => {

    const creationContent: Partial<Bounty> = {
      title: 'Example',
      createdBy: adminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'open',
      rewardAmount: 5,
      chainId: 1,
      rewardToken: 'ETH'
    };

    await request(baseUrl)
      .post('/api/bounties')
      .set('Cookie', adminCookie)
      .send(creationContent)
      .expect(401);

  });

});
