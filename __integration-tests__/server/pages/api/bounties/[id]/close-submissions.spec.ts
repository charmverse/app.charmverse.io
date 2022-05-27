/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Bounty, Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl } from 'testing/mockApiCall';
import { generateBounty, generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ApplicationCreationData, SubmissionCreationData, SubmissionReview } from 'lib/applications/interfaces';
import { createBounty } from 'lib/bounties';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { countValidSubmissions } from 'lib/applications/shared';
import { BountyWithDetails } from 'models';

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

describe('POST /api/bounties/{submissionId}/close-submissions - close a bounty to new submissions and applications', () => {

  it('should return the bounty with a submissions cap equal to current amount of valid submissions and respond with 200', async () => {

    const reviewer = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const reviewerCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: reviewer.addresses[0]
      })).headers['set-cookie'][0];

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open',
      reviewer: reviewer.id
    });

    const result = (await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/close-submissions`)
      .set('Cookie', reviewerCookie)
      .send({})
      .expect(200)).body as BountyWithDetails;

    // Count valid subs before any change took place
    const validSubmissions = countValidSubmissions(bounty.applications);
    const validSubmissionsAfterUpdate = countValidSubmissions(result.applications);

    expect(validSubmissionsAfterUpdate).toEqual(validSubmissions);

    expect(validSubmissionsAfterUpdate).toBe(result.maxSubmissions);

  });
  it('should fail if the user is not at least reviewer or admin and respond with 401', async () => {

    const [reviewer, normalUser] = await Promise.all([
      generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false }),
      generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false })
    ]);

    const normalUserCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: normalUser.addresses[0]
      })).headers['set-cookie'][0];

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open',
      reviewer: reviewer.id
    });

    await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/close-submissions`)
      .set('Cookie', normalUserCookie)
      .send({})
      .expect(401);
  });

});
