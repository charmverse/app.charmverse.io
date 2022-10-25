import type { MemberProperty, Role, Space } from '@prisma/client';
import request from 'supertest';

import { createMemberPropertyPermission } from 'lib/members/createMemberPropertyPermission';
import type { MemberPropertyPermissionWithRole } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateMemberProperty } from 'testing/utils/members';

let space: Space;
let adminUser: LoggedInUser;
let nonAdminUser: LoggedInUser;
let adminCookie: string;
let nonAdminCookie: string;

beforeAll(async () => {
  const { user, space: generatedSpace } = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generatedSpace;
  adminUser = user;
  nonAdminUser = await generateSpaceUser({ spaceId: generatedSpace.id, isAdmin: false });
  nonAdminCookie = await loginUser(nonAdminUser.id);
  adminCookie = await loginUser(adminUser.id);
});

describe('GET /api/space/[id]/members/properties/permissions - Create and delete property permissions', () => {
  let property1: MemberProperty;
  let property2: MemberProperty;
  let role1: Role;
  let role2: Role;

  beforeAll(async () => {
    property1 = await generateMemberProperty({ type: 'text', userId: adminUser.id, spaceId: space.id, name: 'test text' });
    property2 = await generateMemberProperty({ type: 'number', userId: adminUser.id, spaceId: space.id, name: 'test number' });
    role1 = await generateRole({ spaceId: space.id, roleName: 'test role 1', createdBy: adminUser.id });
    role2 = await generateRole({ spaceId: space.id, roleName: 'test role 2', createdBy: adminUser.id });
  });

  it('should create member property permission for admin user', async () => {
    const createdPermission = (await request(baseUrl)
      .post(`/api/spaces/${space.id}/members/properties/permissions`)
      .set('Cookie', adminCookie)
      .send({
        memberPropertyId: property1.id,
        roleId: role1.id
      })
      .expect(201)).body as MemberPropertyPermissionWithRole;

    expect(createdPermission.memberPropertyId).toEqual(property1.id);
  });

  it('should not allow creating permission for non-admin user', async () => {
    (await request(baseUrl)
      .post(`/api/spaces/${space.id}/members/properties/permissions`)
      .set('Cookie', nonAdminCookie)
      .send({
        memberPropertyId: property1.id,
        roleId: role1.id
      })
      .expect(401)).body as MemberProperty[];
  });

  it('should return error for user from other space', async () => {
    const { user: otherSpaceUser } = await generateUserAndSpaceWithApiToken(undefined, true);
    const otherSpaceUserCookie = await loginUser(otherSpaceUser.id);

    (await request(baseUrl)
      .post(`/api/spaces/${space.id}/members/properties/permissions`)
      .set('Cookie', otherSpaceUserCookie)
      .send({
        memberPropertyId: property1.id,
        roleId: role1.id
      })
      .expect(401)).body as MemberProperty[];
  });

  it('should delete member property permission for admin user', async () => {
    const permission = await createMemberPropertyPermission({ memberPropertyId: property1.id, roleId: role1.id });

    (await request(baseUrl)
      .delete(`/api/spaces/${space.id}/members/properties/permissions`)
      .set('Cookie', adminCookie)
      .send({
        permissionId: permission.id
      })
      .expect(200)).body as MemberPropertyPermissionWithRole;
  });

  it('should not allow deleting permission for non-admin user', async () => {
    const permission = await createMemberPropertyPermission({ memberPropertyId: property1.id, roleId: role1.id });

    (await request(baseUrl)
      .delete(`/api/spaces/${space.id}/members/properties/permissions`)
      .set('Cookie', nonAdminCookie)
      .send({
        permissionId: permission.id
      })
      .expect(401)).body as MemberPropertyPermissionWithRole;
  });

  it('should return error for user from other space when trying to delete space', async () => {
    const { user: otherSpaceUser } = await generateUserAndSpaceWithApiToken(undefined, true);
    const otherSpaceUserCookie = await loginUser(otherSpaceUser.id);
    const permission = await createMemberPropertyPermission({ memberPropertyId: property1.id, roleId: role1.id });

    (await request(baseUrl)
      .delete(`/api/spaces/${space.id}/members/properties/permissions`)
      .set('Cookie', otherSpaceUserCookie)
      .send({
        permissionId: permission.id
      })
      .expect(401)).body as MemberProperty[];
  });
});
