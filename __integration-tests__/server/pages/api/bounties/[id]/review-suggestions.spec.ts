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
import { prisma } from 'db';

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

  it('should return the now open and bounty respond with 200', async () => {

    const admin = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: true });

    const adminCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: admin.addresses[0]
      })).headers['set-cookie'][0];

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const result = (await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/review-suggestion`)
      .set('Cookie', adminCookie)
      .send({ decision: 'approve' })
      .expect(200)).body as BountyWithDetails;

    // Ensures we receive an object with this property
    expect(result.status).toBe('open');
    // Ensures the BountyWithDetails interface is returned, not just the bounty
    expect(result.applications).toBeInstanceOf(Array);

  });

  it('should delete the bounty if rejected and respond with 200', async () => {

    const admin = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: true });

    const adminCookie = (await request(baseUrl)
      .post('/api/session/login')
      .send({
        address: admin.addresses[0]
      })).headers['set-cookie'][0];

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const result = (await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/review-suggestion`)
      .set('Cookie', adminCookie)
      .send({ decision: 'reject' })
      .expect(200)).body;

    // Ensures we receive an object with this property
    expect(result.success).toBe(true);

    const bountyAfterProcessing = await prisma.bounty.findUnique({
      where: {
        id: bounty.id
      }
    });

    expect(bountyAfterProcessing).toBeNull();

  });
  it('should fail if the user is not a space admin and respond with 401', async () => {

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/review-suggestion`)
      .set('Cookie', nonAdminCookie)
      .send({ decision: 'approve' })
      .expect(401);

  });

});
