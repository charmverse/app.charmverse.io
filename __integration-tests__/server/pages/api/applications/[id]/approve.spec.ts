/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';

import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import { assignRole } from 'lib/roles';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBountyWithSingleApplication, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(generated.user.id);
});

describe('POST /api/applications/{applicationId}/approve - accept an application to become a submitter', () => {

  it('should succed if the user has "approve_applications" permission, and respond with 200', async () => {

    const reviewer = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const reviewerCookie = await loginUser(reviewer.id);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'applied',
      bountyCap: null,
      bountyStatus: 'open',
      // Reviewer status is now assigned via permissions
      reviewer: undefined
    });

    const role = await generateRole({
      createdBy: reviewer.id,
      spaceId: nonAdminUserSpace.id
    });

    await assignRole({
      roleId: role.id,
      userId: reviewer.id
    });

    await addBountyPermissionGroup({
      level: 'reviewer',
      resourceId: bounty.id,
      assignee: {
        group: 'role',
        id: role.id
      }
    });

    await request(baseUrl)
      .post(`/api/applications/${bounty.applications[0].id}/approve`)
      .set('Cookie', reviewerCookie)
      .send({})
      .expect(200);
  });

  it('should allow a space admin to accept an applicant to become submitter and respond with 200', async () => {

    const admin = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: true });

    const adminCookie = await loginUser(admin.id);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'applied',
      bountyCap: null,
      bountyStatus: 'open',
      // Reviewer status is now assigned via permissions
      reviewer: undefined
    });

    await request(baseUrl)
      .post(`/api/applications/${bounty.applications[0].id}/approve`)
      .set('Cookie', adminCookie)
      .send({})
      .expect(200);
  });

  it('should fail if the requesting non-admin user does not have the "review" permission and respond with 401', async () => {

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: nonAdminUserSpace.id
    });

    const extraUserCookie = await loginUser(extraUser.id);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'applied',
      bountyCap: null,
      bountyStatus: 'open',
      // Reviewer status is now assigned via permissions
      reviewer: undefined
    });

    await request(baseUrl)
      .post(`/api/applications/${bounty.applications[0].id}/approve`)
      .set('Cookie', extraUserCookie)
      .send({})
      .expect(401);
  });

});
