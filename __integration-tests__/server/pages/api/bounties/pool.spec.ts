/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import { BountySubmitterPoolCalculation, BountySubmitterPoolSize, createBounty } from 'lib/bounties';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import { assignRole } from 'lib/roles';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: User;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(nonAdminUser);
});

describe('POST /api/bounties/pool - Return breakdown of how many people can apply', () => {

  it('should return the bounty pool size based on current bounty permissions and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

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

    // This should be ignored in following call
    await addBountyPermissionGroup({
      assignee: {
        group: 'role',
        id: role.id
      },
      level: 'submitter',
      resourceId: bounty.id
    });

    const { mode, roleups, total } = (await request(baseUrl)
      .post('/api/bounties/pool')
      .set('Cookie', extraUserCookie)
      .send({
        resourceId: bounty.id
      })
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode === 'role').toBe(true);
    expect(roleups.length).toBe(1);
    // 1 space member assigned to role
    expect(total).toBe(1);
  });

  it('should return the bounty pool size based on a simulation of permissions (if user has grant permissions ability) and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });
    const secondExtraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const bounty = await createBounty({
      spaceId: nonAdminUserSpace.id,
      createdBy: nonAdminUser.id,
      title: 'Example'
    });

    const role = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    // This shouldn't be taken into account for our simulation
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

    const simulation: BountySubmitterPoolCalculation = {
      resourceId: bounty.id,
      permissions: {
        submitter: [{ group: 'role', id: role.id }]
      }
    };

    // Creator is querying permissions
    const { mode, roleups, total } = (await request(baseUrl)
      .post('/api/bounties/pool')
      .set('Cookie', nonAdminCookie)
      .send(simulation)
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode === 'role').toBe(true);
    expect(roleups.length).toBe(1);
    expect(roleups[0].id === role.id).toBe(true);

    // 2 users were assigned to 1 role
    expect(total).toBe(2);
  });

  it('should return the bounty pool size based on a simulation of permissions for an inexistent bounty and respond with 200', async () => {

    const extraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });
    const secondExtraUser = await generateSpaceUser({ spaceId: nonAdminUserSpace.id, isAdmin: false });

    const bounty = await createBounty({
      spaceId: nonAdminUserSpace.id,
      createdBy: extraUser.id,
      title: 'Example'
    });

    const role = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    // This shouldn't be taken into account for our simulation
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

    const simulation: BountySubmitterPoolCalculation = {
      permissions: {
        submitter: [{ group: 'role', id: role.id }]
      }
    };

    // Creator is querying permissions
    const { mode, roleups, total } = (await request(baseUrl)
      .post('/api/bounties/pool')
      .set('Cookie', nonAdminCookie)
      .send(simulation)
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode === 'role').toBe(true);
    expect(roleups.length).toBe(1);
    expect(roleups[0].id === role.id).toBe(true);

    // 2 users were assigned to 1 role
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
      .post('/api/bounties/pool')
      .set('Cookie', externalUserCookie)
      .send({
        resourceId: bounty.id
      })
      .expect(200)).body as BountySubmitterPoolSize;

    expect(mode).toBe('space');
    expect(roleups.length).toBe(0);
    expect(total).toBe(0);

  });

});
