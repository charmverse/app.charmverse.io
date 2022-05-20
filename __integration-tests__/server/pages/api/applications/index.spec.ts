/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Bounty, Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ApplicationCreationData } from 'lib/applications/interfaces';
import { createBounty } from 'lib/bounties';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: nonAdminUser.addresses[0]
    })).headers['set-cookie'][0];
});

describe('POST /api/applications - update an application', () => {

  it('should create the application and respond with 201', async () => {

    const bounty = await createBounty({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      title: 'Example title',
      status: 'open',
      rewardAmount: 1
    });

    const creationContent: Partial<ApplicationCreationData> = {
      bountyId: bounty.id,
      message: "I'm volunteering for this as it's in my field of expertise"
    };

    const createdApplication = (await request(baseUrl)
      .post('/api/applications')
      .set('Cookie', nonAdminCookie)
      .send(creationContent)
      .expect(201)).body;

    expect(createdApplication).toEqual(
      expect.objectContaining<Partial<Application>>({
        ...creationContent
      })
    );

  });

  it('should fail if the user is not a member of the space, and respond 401', async () => {

    const { space: otherSpace, user: userFromOtherSpace } = await generateUserAndSpaceWithApiToken();

    const bounty = await createBounty({
      createdBy: userFromOtherSpace.id,
      spaceId: otherSpace.id,
      title: 'Example title',
      status: 'open',
      rewardAmount: 1
    });

    const creationContent: Partial<ApplicationCreationData> = {
      bountyId: bounty.id,
      message: "I'm volunteering for this as it's in my field of expertise"
    };

    await request(baseUrl)
      .post('/api/applications')
      .set('Cookie', nonAdminCookie)
      .send(creationContent)
      .expect(401);

  });

});
