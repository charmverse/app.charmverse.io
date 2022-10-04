/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import { BountyPermissionLevel } from '@prisma/client';
import request from 'supertest';

import type { AssignedBountyPermissions } from 'lib/bounties';
import { typedKeys } from 'lib/utilities/objects';
import type { LoggedInUser } from 'models';
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

describe('GET /api/bounties/{bountyId}/permissions - Return assigned and individual permissions for a bounty', () => {

  it('should return the bounty query and computed user permissions for a bounty and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const extraUserCookie = await loginUser(extraUser.id);

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const { bountyPermissions, userPermissions } = (await request(baseUrl)
      .get(`/api/bounties/${bounty.id}/permissions`)
      .set('Cookie', extraUserCookie)
      .expect(200)).body as AssignedBountyPermissions;

    expect(bountyPermissions).toBeDefined();
    expect(userPermissions).toBeDefined();

    // Verify user permissions shape
    typedKeys(userPermissions).forEach(key => {
      expect(typeof userPermissions[key] as any).toEqual('boolean');
    });

    // Verify rollup across levels and assignments
    typedKeys(BountyPermissionLevel).forEach(key => {
      expect(bountyPermissions[key]).toBeInstanceOf(Array);
    });

  });

  it('should respond with empty permissions if user does not have view permission', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const extraUserCookie = await loginUser(extraUser.id);

    // Bounty with a base permission set
    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const { bountyPermissions, userPermissions } = (await request(baseUrl)
      .get(`/api/bounties/${bounty.id}/permissions`)
      .set('Cookie', extraUserCookie)
      .expect(200)).body as AssignedBountyPermissions;

    expect(bountyPermissions).toBeDefined();
    expect(userPermissions).toBeDefined();

    // Make sure access is full false
    typedKeys(userPermissions).forEach(key => {
      expect(userPermissions[key] as any).toBe(false);
    });

    // Make sure it's empty everywhere and doesn't leak info about roles
    typedKeys(BountyPermissionLevel).forEach(key => {
      if (key !== 'creator') {
        expect(bountyPermissions[key].length).toBe(0);
      }
    });
  });

});
