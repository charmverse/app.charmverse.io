/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Bounty, Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl } from 'testing/mockApiCall';
import { generateBounty, generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ApplicationCreationData, SubmissionCreationData, SubmissionReview } from 'lib/applications/interfaces';
import { createBounty } from 'lib/bounties';
import { generateSubmissionContent } from 'testing/generate-stubs';

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

describe('POST /api/submissions/{submissionId}/review - review a submission', () => {

  it('should allow the reviewer to review a submission and respond with 200', async () => {

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

    const decision: Pick<SubmissionReview, 'decision'> = {
      decision: 'approve'
    };

    await request(baseUrl)
      .post(`/api/submissions/${bounty.applications[0].id}/review`)
      .set('Cookie', reviewerCookie)
      .send(decision)
      .expect(200);
  });

  it('should allow a space admin to review a submission and respond with 200', async () => {

    const adminUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: true });

    const adminUserCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: adminUser.addresses[0]
      })).headers['set-cookie'][0];

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open',
      reviewer: nonAdminUser.id
    });

    const decision: Pick<SubmissionReview, 'decision'> = {
      decision: 'approve'
    };

    await request(baseUrl)
      .post(`/api/submissions/${bounty.applications[0].id}/review`)
      .set('Cookie', adminUserCookie)
      .send(decision)
      .expect(200);
  });

  it('should fail if the requesting user is neither a space admin, nor the reviewer and respond with 200', async () => {

    const user = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const userCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: user.addresses[0]
      })).headers['set-cookie'][0];

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open',
      reviewer: nonAdminUser.id
    });

    const decision: Pick<SubmissionReview, 'decision'> = {
      decision: 'approve'
    };

    await request(baseUrl)
      .post(`/api/submissions/${bounty.applications[0].id}/review`)
      .set('Cookie', userCookie)
      .send(decision)
      .expect(401);
  });

});
