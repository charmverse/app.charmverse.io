/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';

import type { BountyWithDetails } from 'lib/bounties';
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

describe('POST /api/bounties/{submissionId}/close - close a bounty', () => {

  it('should allow a user with the lock permission to close the bounty, returning the bounty with complete status and responding with 200', async () => {

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open'
    });

    await addBountyPermissionGroup({
      // Only creator currently has lock permission (outside of admins)
      level: 'creator',
      assignee: {
        group: 'user',
        id: nonAdminUser.id
      },
      resourceId: bounty.id
    });

    const result = (await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/close`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(200)).body as BountyWithDetails;

    expect(result.status).toBe('complete');
  });

  it('should allow a space admin to close the bounty, returning the bounty with complete status and responding with 200', async () => {

    const adminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: true
    });

    const adminCookie = await loginUser(adminUser.id);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open'
    });

    const result = (await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/close`)
      .set('Cookie', adminCookie)
      .send({})
      .expect(200)).body as BountyWithDetails;

    expect(result.status).toBe('complete');
  });

  it('should fail if the non-admin user does not have the lock permission and respond with 401', async () => {

    const extraNonAdminUser = await generateSpaceUser({
      spaceId: nonAdminUserSpace.id,
      isAdmin: false
    });

    const extraNonAdminUserCookie = await loginUser(extraNonAdminUser.id);

    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open'
    });

    await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/close`)
      .set('Cookie', extraNonAdminUserCookie)
      .send({})
      .expect(401);
  });

});
