/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Application, Space, User } from '@prisma/client';
import request from 'supertest';

import type { SubmissionReview } from 'lib/applications/interfaces';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import type { LoggedInUser } from 'models';
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

describe('POST /api/submissions/{submissionId}/mark-as-paid - Update submission status to "paid"', () => {

  it('should succed if the user has "review" permission, respond with 200', async () => {

    const reviewer = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const reviewerCookie = await loginUser(reviewer.id);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'complete',
      bountyCap: null,
      bountyStatus: 'open'
    });

    await addBountyPermissionGroup({
      level: 'reviewer',
      resourceId: bounty.id,
      assignee: {
        group: 'user',
        id: reviewer.id
      }
    });

    const afterUpdate = (await request(baseUrl)
      .post(`/api/submissions/${bounty.applications[0].id}/mark-as-paid`)
      .set('Cookie', reviewerCookie)
      .send({})
      .expect(200)).body as Application;

    expect(afterUpdate.status).toBe('paid');

  });

  it('should allow a space admin to review a submission and respond with 200', async () => {

    const adminUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: true });

    const adminUserCookie = await loginUser(adminUser.id);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'complete',
      bountyCap: null,
      bountyStatus: 'open',
      reviewer: nonAdminUser.id
    });

    const afterUpdate = (await request(baseUrl)
      .post(`/api/submissions/${bounty.applications[0].id}/mark-as-paid`)
      .set('Cookie', adminUserCookie)
      .send({})
      .expect(200)).body as Application;

    expect(afterUpdate.status).toBe('paid');
  });

  it('should fail if the requesting non-admin user does not have the "review" permission and respond with 401', async () => {

    const user = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const userCookie = await loginUser(user.id);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'complete',
      bountyCap: null,
      bountyStatus: 'open',
      reviewer: nonAdminUser.id
    });

    const decision: Pick<SubmissionReview, 'decision'> = {
      decision: 'approve'
    };

    await request(baseUrl)
      .post(`/api/submissions/${bounty.applications[0].id}/mark-as-paid`)
      .set('Cookie', userCookie)
      .send(decision)
      .expect(401);
  });

});
