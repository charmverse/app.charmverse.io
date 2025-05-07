import type { Role, Space, User } from '@charmverse/core/prisma';
import { generateRole, generateUserAndSpace } from '@packages/testing/setupDatabase';

import type { AbstractPermission } from '../filterApplicablePermissions';
import { filterApplicablePermissions } from '../filterApplicablePermissions';

let user: User;
let role: Role;
let nonAssignedRole: Role;
let space: Space;
let userPermission: AbstractPermission;
let otherUserPermission: AbstractPermission;
let rolePermission: AbstractPermission;
let otherRolePermission: AbstractPermission;
let spacePermission: AbstractPermission;
let otherSpacePermission: AbstractPermission;
let publicPermission: AbstractPermission;

let permissions: AbstractPermission[];

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: false
  });

  user = generated.user;
  space = generated.space;
  role = await generateRole({
    spaceId: space.id,
    createdBy: user.id,
    assigneeUserIds: [user.id]
  });
  nonAssignedRole = await generateRole({
    spaceId: space.id,
    createdBy: user.id
  });

  userPermission = {
    userId: user.id
  };

  otherUserPermission = {
    userId: 'other-user-id'
  };

  rolePermission = {
    roleId: role.id
  };

  otherRolePermission = {
    roleId: nonAssignedRole.id
  };

  spacePermission = {
    spaceId: space.id
  };

  otherSpacePermission = {
    spaceId: 'other-space-id'
  };

  publicPermission = {
    public: true
  };

  permissions = [
    userPermission,
    otherUserPermission,
    rolePermission,
    otherRolePermission,
    spacePermission,
    otherSpacePermission,
    publicPermission
  ];
});

describe('filterApplicablePermissions', () => {
  // Priority of permissions: User > Role > Space > Public
  it('should return only permissions that target the user if these exist', async () => {
    const applicablePermissions = await filterApplicablePermissions({
      permissions,
      resourceSpaceId: space.id,
      userId: user.id
    });
    expect(applicablePermissions).toEqual([userPermission]);
  });

  it('should return only permissions that target roles the user belongs to if these exist and there are no user permissions', async () => {
    const permissionsWithoutUser = permissions.filter((p) => !p.userId);
    const applicablePermissions = await filterApplicablePermissions({
      permissions: permissionsWithoutUser,
      resourceSpaceId: space.id,
      userId: user.id
    });
    expect(applicablePermissions).toEqual([rolePermission]);
  });

  it('should return only space permissions if the user belongs to if these exist and there are no applicable user or role permissions', async () => {
    const permissionsWithoutUserAndRole = permissions.filter((p) => !p.userId && !p.roleId);
    const applicablePermissions = await filterApplicablePermissions({
      permissions: permissionsWithoutUserAndRole,
      resourceSpaceId: space.id,
      userId: user.id
    });
    expect(applicablePermissions).toEqual([spacePermission]);
  });

  it('should return only public permissions if there is no user', async () => {
    const applicablePermissions = await filterApplicablePermissions({
      permissions,
      resourceSpaceId: space.id
    });
    expect(applicablePermissions).toEqual([publicPermission]);
  });

  it('should return only public permissions if the user is not a space member', async () => {
    const { user: userInDifferentSpace } = await generateUserAndSpace();
    const applicablePermissions = await filterApplicablePermissions({
      permissions,
      resourceSpaceId: space.id,
      userId: userInDifferentSpace.id
    });
    expect(applicablePermissions).toEqual([publicPermission]);
  });
});
