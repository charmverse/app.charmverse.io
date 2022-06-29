/* eslint-disable @typescript-eslint/no-unused-vars */
import { Application, Bounty, BountyPermissionLevel, Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateBountyWithSingleApplication, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { ApplicationCreationData, SubmissionCreationData, SubmissionReview } from 'lib/applications/interfaces';
import { AssignedBountyPermissions, BountyPermissions, BountySubmitterPoolSize, createBounty } from 'lib/bounties';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { countValidSubmissions } from 'lib/applications/shared';
import { BountyWithDetails } from 'models';
import { prisma } from 'db';
import { typedKeys } from 'lib/utilities/objects';
import { assignRole } from 'lib/roles';

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

describe('GET /api/bounties/{bountyId}/permissions - Return assigned and individual permissions for a bounty', () => {

  it('should return the bounty pool size based on current bounty permissions and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const extraUserCookie = await loginUser(extraUser);

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const { bountyPermissions, userPermissions } = (await request(baseUrl)
      .get(`/api/bounties/${bounty.id}/pool`)
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

  it('should return the bounty pool size based on a simulation of permissions and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });
    const secondExtraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const extraUserCookie = await loginUser(extraUser);

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const role = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    const secondRole = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    await assignRole({
      roleId: role.id,
      userId: secondExtraUser.id
    });

    await assignRole({
      roleId: secondRole.id,
      userId: secondExtraUser.id
    });

    const { mode, roleups, total } = (await request(baseUrl)
      .get(`/api/bounties/${bounty.id}/pool`)
      .set('Cookie', extraUserCookie)
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode === 'role').toBe(true);
    expect(roleups.length).toBe(1);
    expect(roleups[0].id).toBe(role.id);

    // 3 spaceRoleToRoles exist, but only 2 users
    expect(total).toBe(2);
  });

  it('should respond with empty permissions if user does not have view permission', async () => {

    const externalUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const externalUserCookie = await loginUser(externalUser);

    // Bounty with a base permission set
    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      status: 'suggestion',
      approveSubmitters: false,
      createdBy: nonAdminUser.id
    });

    const { mode, roleups, total } = (await request(baseUrl)
      .get(`/api/bounties/${bounty.id}/pool`)
      .set('Cookie', externalUserCookie)
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode).toBe('space');
    expect(roleups.length).toBe(0);
    expect(total).toBe(0);

  });

});
