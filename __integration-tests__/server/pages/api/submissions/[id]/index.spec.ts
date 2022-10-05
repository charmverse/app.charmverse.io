/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Application, Space, User } from '@prisma/client';
import request from 'supertest';

import type { LoggedInUser } from 'models';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);
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
