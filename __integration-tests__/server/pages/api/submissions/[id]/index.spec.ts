/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Bounty, Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl } from 'testing/mockApiCall';
import { generateBounty, generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ApplicationCreationData, SubmissionCreationData } from 'lib/applications/interfaces';
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

describe('PUT /api/submissions/{submissionId} - update a submission', () => {

  it('should return the updated submission and respond with 200', async () => {

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'inProgress',
      bountyCap: null,
      bountyStatus: 'open'
    });

    const submissionContent = generateSubmissionContent();

    submissionContent.submission = 'New text';

    const updatedSubmission = (await request(baseUrl)
      .put(`/api/submissions/${bounty.applications[0].id}`)
      .set('Cookie', nonAdminCookie)
      .send(submissionContent)
      .expect(200)).body as Application;

    expect(updatedSubmission.submission).toBe(submissionContent.submission);
    expect(updatedSubmission.submissionNodes).toBe(submissionContent.submissionNodes);

  });

  it('should fail if the user did not create the submission they are trying to update, and respond with 401', async () => {

    const otherUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const bounty = await generateBountyWithSingleApplication({
      userId: otherUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'inProgress',
      bountyCap: null,
      bountyStatus: 'open'
    });

    const submissionContent = generateSubmissionContent();

    submissionContent.submission = 'New text';
    await request(baseUrl)
      .put(`/api/submissions/${bounty.applications[0].id}`)
      .set('Cookie', nonAdminCookie)
      .send(submissionContent)
      .expect(401);

  });

});
