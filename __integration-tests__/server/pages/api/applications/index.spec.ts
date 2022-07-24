/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Space, User } from '@prisma/client';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { ApplicationCreationData, ListApplicationsResponse, SubmissionCreationData } from 'lib/applications/interfaces';
import { createBounty } from 'lib/bounties';
import { DataNotFoundError } from 'lib/utilities/errors';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateBountyWithSingleApplication, generateSpaceUser, generateTransaction, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';

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

describe('GET /api/applications - retrieve all applications for a bounty', () => {
  it('Should fail if no bounty with passed bountyId was found', async () => {
    try {
      (await request(baseUrl).get(`/api/applications?bountyId=${v4()}`).set('Cookie', nonAdminCookie).expect(404));
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the user is not a member of the space, and respond 401', async () => {

    const { space: otherSpace, user: userFromOtherSpace } = await generateUserAndSpaceWithApiToken();
    const bounty = await generateBounty({
      createdBy: userFromOtherSpace.id,
      spaceId: otherSpace.id,
      status: 'open',
      approveSubmitters: false
    });

    await request(baseUrl)
      .get(`/api/applications?bountyId=${bounty.id}&submissionsOnly=false`)
      .set('Cookie', nonAdminCookie)
      .expect(401);
  });

  it('should retrieve submissions along with transactions', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: nonAdminUser.id,
      bountyStatus: 'open',
      spaceId: nonAdminUserSpace.id
    });

    await generateTransaction({
      applicationId: bounty.applications[0].id
    });

    const applicationsWithTransactions = (await request(baseUrl)
      .get(`/api/applications?bountyId=${bounty.id}&submissionsOnly=false`)
      .set('Cookie', nonAdminCookie)
      .expect(200)).body as ListApplicationsResponse;
    expect(applicationsWithTransactions.applications.length).toBe(1);
    expect(applicationsWithTransactions.applications[0].transactions.length).toBe(1);
  });
});

describe('POST /api/applications - create an application', () => {
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

    await addBountyPermissionGroup({
      level: 'submitter',
      assignee: {
        group: 'user',
        id: nonAdminUser.id
      },
      resourceId: bounty.id
    });

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

  it('should fail if the user does not have the "work" permission for this bounty and respond with 401', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const bounty = await generateBounty({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      approveSubmitters: false,
      status: 'open'
    });

    const creationContent: Partial<ApplicationCreationData> = {
      bountyId: bounty.id,
      message: 'I\'m volunteering for this as it\'s in my field of expertise'
    };

    const extraUserCookie = await loginUser(extraUser);

    await request(baseUrl)
      .post('/api/applications')
      .set('Cookie', extraUserCookie)
      .send(creationContent)
      .expect(401);

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
