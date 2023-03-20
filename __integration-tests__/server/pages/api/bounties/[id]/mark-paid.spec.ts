/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';

import type { BountyWithDetails } from 'lib/bounties';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import {
  generateBountyWithSingleApplication,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);
});

describe('POST /api/bounties/{submissionId}/mark-paid - marking bounty as paid', () => {
  it('should allow a user with the mark-paid permission mark the bounty as paid, returning the bounty with paid status and responding with 200', async () => {
    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open',
      customReward: 'Custom NFT'
    });

    await addBountyPermissionGroup({
      level: 'creator',
      assignee: {
        group: 'user',
        id: nonAdminUser.id
      },
      resourceId: bounty.id
    });

    const result = (
      await request(baseUrl)
        .post(`/api/bounties/${bounty.id}/mark-paid`)
        .set('Cookie', nonAdminCookie)
        .send({})
        .expect(200)
    ).body as BountyWithDetails;

    expect(result.status).toBe('paid');
  });

  it('should allow a space admin to mark the bounty as paid, returning the bounty with paid status and responding with 200', async () => {
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
      bountyStatus: 'open',
      customReward: 'Custom NFT'
    });

    const result = (
      await request(baseUrl)
        .post(`/api/bounties/${bounty.id}/mark-paid`)
        .set('Cookie', adminCookie)
        .send({})
        .expect(200)
    ).body as BountyWithDetails;

    expect(result.status).toBe('paid');
  });

  it("should fail if the bounty in question doesn't have any custom reward and respond with 400", async () => {
    const bounty = await generateBountyWithSingleApplication({
      userId: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      applicationStatus: 'review',
      bountyCap: null,
      bountyStatus: 'open'
    });

    await addBountyPermissionGroup({
      level: 'creator',
      assignee: {
        group: 'user',
        id: nonAdminUser.id
      },
      resourceId: bounty.id
    });

    await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/mark-paid`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(400);
  });

  it('should fail if the non-admin user does not have the mark-paid permission and respond with 401', async () => {
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
      bountyStatus: 'open',
      customReward: 'Custom NFT'
    });

    await request(baseUrl)
      .post(`/api/bounties/${bounty.id}/mark-paid`)
      .set('Cookie', extraNonAdminUserCookie)
      .send({})
      .expect(401);
  });
});
