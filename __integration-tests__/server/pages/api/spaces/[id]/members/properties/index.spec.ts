import type { MemberProperty, Role, Space } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';

import { createMemberPropertyPermission } from 'lib/members/createMemberPropertyPermission';
import { deleteMemberPropertyPermission } from 'lib/members/deleteMemberPropertyPermission';
import type { MemberPropertyPermissionWithRole } from 'lib/members/interfaces';
import { assignRole } from 'lib/roles';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateMemberProperty } from 'testing/utils/members';

let space: Space;
let adminUser: LoggedInUser;
let nonAdminUser: LoggedInUser;
let adminCookie: string;
let nonAdminCookie: string;
let role: Role;
let permission: MemberPropertyPermissionWithRole | null;

beforeAll(async () => {
  const { user, space: generatedSpace } = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generatedSpace;
  adminUser = user;
  nonAdminUser = await generateSpaceUser({ spaceId: generatedSpace.id, isAdmin: false });
  nonAdminCookie = await loginUser(nonAdminUser.id);
  adminCookie = await loginUser(adminUser.id);
  role = await generateRole({ spaceId: space.id, roleName: 'test role 1', createdBy: adminUser.id });
});

describe('GET /api/space/[id]/members/properties - Get member properties', () => {
  let property1: MemberProperty;
  let property2: MemberProperty;

  beforeAll(async () => {
    property1 = await generateMemberProperty({
      type: 'text',
      userId: adminUser.id,
      spaceId: space.id,
      name: 'test text'
    });
    property2 = await generateMemberProperty({
      type: 'number',
      userId: adminUser.id,
      spaceId: space.id,
      name: 'test number'
    });
  });

  afterEach(async () => {
    if (permission) {
      await deleteMemberPropertyPermission(permission.id);
      permission = null;
    }
  });
  it('should return member properties for admin user', async () => {
    const memberProperties = (
      await request(baseUrl).get(`/api/spaces/${space.id}/members/properties`).set('Cookie', adminCookie).expect(200)
    ).body as MemberProperty[];

    expect(memberProperties.length).toBe(2);
    expect(memberProperties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: property1.id }),
        expect.objectContaining({ id: property2.id })
      ])
    );
  });

  it('should return member properties for non-admin user', async () => {
    // TODO - test returning only permitted props when will be ready
    const memberProperties = (
      await request(baseUrl).get(`/api/spaces/${space.id}/members/properties`).set('Cookie', nonAdminCookie).expect(200)
    ).body as MemberProperty[];

    expect(memberProperties.length).toBe(2);
    expect(memberProperties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: property1.id }),
        expect.objectContaining({ id: property2.id })
      ])
    );
  });

  it('should return only properties without permissions set for non-admin user', async () => {
    permission = await createMemberPropertyPermission({ roleId: role.id, memberPropertyId: property1.id });

    const memberProperties = (
      await request(baseUrl).get(`/api/spaces/${space.id}/members/properties`).set('Cookie', nonAdminCookie).expect(200)
    ).body as MemberProperty[];

    expect(memberProperties.length).toBe(1);
    expect(memberProperties).toEqual(expect.arrayContaining([expect.objectContaining({ id: property2.id })]));
  });

  it('should return only properties accessible for non-admin user by assigned role', async () => {
    permission = await createMemberPropertyPermission({ roleId: role.id, memberPropertyId: property1.id });
    await assignRole({ userId: nonAdminUser.id, roleId: role.id });

    const memberProperties = (
      await request(baseUrl).get(`/api/spaces/${space.id}/members/properties`).set('Cookie', nonAdminCookie).expect(200)
    ).body as MemberProperty[];

    expect(memberProperties.length).toBe(2);
    expect(memberProperties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: property1.id }),
        expect.objectContaining({ id: property2.id })
      ])
    );
  });

  it('should return error for user from other space', async () => {
    const { user: otherSpaceUser } = await generateUserAndSpaceWithApiToken(undefined, true);
    const otherSpaceUserCookie = await loginUser(otherSpaceUser.id);

    await request(baseUrl)
      .get(`/api/spaces/${space.id}/members/properties`)
      .set('Cookie', otherSpaceUserCookie)
      .expect(401);
  });
});
