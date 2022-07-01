/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Bounty, Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ApplicationCreationData, SubmissionCreationData, SubmissionReview } from 'lib/applications/interfaces';
import { createBounty } from 'lib/bounties';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(nonAdminUser);
});

describe('POST /api/submissions/{submissionId}/review - review a submission', () => {

  it('should succed if the user has "review" permission, respond with 200', async () => {

    const reviewer = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const reviewerCookie = await loginUser(reviewer);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open',
      // Reviewer status is now assigned via permissions
      reviewer: undefined
    });

    await addBountyPermissionGroup({
      level: 'reviewer',
      resourceId: bounty.id,
      assignee: {
        group: 'user',
        id: reviewer.id
      }
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

    const adminUserCookie = await loginUser(adminUser);

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

  it('should fail if the requesting non-admin user does not have the "review" permission and respond with 401', async () => {

    const user = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const userCookie = await loginUser(user);

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
