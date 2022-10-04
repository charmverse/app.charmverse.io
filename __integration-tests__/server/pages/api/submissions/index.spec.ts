/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Application, Space, User } from '@prisma/client';
import request from 'supertest';

import type { SubmissionCreationData } from 'lib/applications/interfaces';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import type { LoggedInUser } from 'models';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);
});

describe('POST /api/submissions - create a submission', () => {

  it('should return the created submission and respond with 201', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const bounty = await generateBounty({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      approveSubmitters: false,
      status: 'open'
    });

    const submissionContent = generateSubmissionContent();

    const creationContent: Partial<SubmissionCreationData> = {
      bountyId: bounty.id,
      submissionContent
    };

    await addBountyPermissionGroup({
      assignee: { id: extraUser.id, group: 'user' },
      level: 'submitter',
      resourceId: bounty.id
    });

    const extraUserCookie = await loginUser(extraUser.id);

    const createdSubmission = (await request(baseUrl)
      .post('/api/submissions')
      .set('Cookie', extraUserCookie)
      .send(creationContent)
      .expect(201)).body as Application;

    expect(createdSubmission.submission).toBe(submissionContent.submission);
    expect(createdSubmission.submissionNodes).toBe(submissionContent.submissionNodes);

  });

  it('should fail if the user does not have the "work" permission for this bounty and respond with 401', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const bounty = await generateBounty({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      approveSubmitters: false,
      status: 'open'
    });

    const submissionContent = generateSubmissionContent();

    const creationContent: Partial<SubmissionCreationData> = {
      bountyId: bounty.id,
      submissionContent
    };

    const extraUserCookie = await loginUser(extraUser.id);

    await request(baseUrl)
      .post('/api/submissions')
      .set('Cookie', extraUserCookie)
      .send(creationContent)
      .expect(401);

  });

  it('should fail if the user is not a member of the space and respond with 401', async () => {

    const { user: otherUser, space: otherSpace } = await generateUserAndSpaceWithApiToken();

    const bounty = await generateBounty({
      createdBy: otherUser.id,
      spaceId: otherSpace.id,
      approveSubmitters: false,
      status: 'open'
    });

    const submissionContent = generateSubmissionContent();

    const creationContent: Partial<SubmissionCreationData> = {
      bountyId: bounty.id,
      submissionContent
    };

    await request(baseUrl)
      .post('/api/submissions')
      .set('Cookie', nonAdminCookie)
      .send(creationContent)
      .expect(401);

  });

});
