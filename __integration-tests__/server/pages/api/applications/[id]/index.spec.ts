/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Application, Space, User } from '@prisma/client';
import request from 'supertest';

import type { ApplicationCreationData, ApplicationUpdateData } from 'lib/applications/interfaces';
import { createBounty } from 'lib/bounties';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);
});

describe('PUT /api/applications/{applicationId} - update an application', () => {

  it('should update the application and respond with 200', async () => {

    const submitterUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: false
    });

    const submitterCookie = await loginUser(submitterUser.id);

    const bounty = await createBounty({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      status: 'open',
      rewardAmount: 1,
      permissions: {
        submitter: [{
          group: 'space',
          id: nonAdminUserSpace.id
        }]
      }
    });

    const creationContent: Partial<ApplicationCreationData> = {
      bountyId: bounty.id,
      message: "I'm volunteering for this as it's in my field of expertise"
    };

    const createdApplication = (await request(baseUrl)
      .post('/api/applications')
      .set('Cookie', submitterCookie)
      .send(creationContent)
      .expect(201)).body;

    const update: Partial<ApplicationUpdateData> = {
      message: 'This is my new application message'
    };

    const updatedApplication = (await request(baseUrl)
      .put(`/api/applications/${createdApplication.id}`)
      .set('Cookie', submitterCookie)
      .send(update)
      .expect(200)).body;

    expect(updatedApplication).toEqual(
      expect.objectContaining<Partial<Application>>({
        ...creationContent,
        message: update.message
      })
    );

  });

  it('should reject attempts to update an application that does not belong to the requester, and respond with 401', async () => {

    const { user: otherUser, space: otherSpace } = await generateUserAndSpaceWithApiToken();

    const submitterUser = await generateSpaceUser({
      spaceId: otherSpace.id,
      isAdmin: false
    });

    const submitterCookie = await loginUser(submitterUser.id);

    const bounty = await createBounty({
      createdBy: otherUser.id,
      spaceId: otherSpace.id,
      status: 'open',
      rewardAmount: 1,
      permissions: {
        submitter: [{
          group: 'space',
          id: otherSpace.id
        }]
      }
    });

    const creationContent: Partial<ApplicationCreationData> = {
      bountyId: bounty.id,
      message: "I'm volunteering for this as it's in my field of expertise"
    };

    const createdApplication = (await request(baseUrl)
      .post('/api/applications')
      .set('Cookie', submitterCookie)
      .send(creationContent)
      .expect(201)).body;

    const update: Partial<ApplicationUpdateData> = {
      message: 'This is my new application message'
    };

    await request(baseUrl)
      .put(`/api/applications/${createdApplication.id}`)
      .set('Cookie', nonAdminCookie)
      .send(update)
      .expect(401);
  });

});
