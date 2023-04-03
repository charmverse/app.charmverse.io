import type { Role, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';

import type { AbstractPermission } from '../filterApplicablePermissions';
import { filterApplicablePermissions } from '../filterApplicablePermissions';

let user: User;
let role: Role;
let nonAssignedRole: Role;
let space: Space;

type ExamplePermissionLevel = 'minimum' | 'maximum';
type ExamplePermission = AbstractPermission<ExamplePermissionLevel>;

let userPermission: ExamplePermission;
let otherUserPermission: ExamplePermission;
let rolePermission: ExamplePermission;
let otherRolePermission: ExamplePermission;
let spacePermission: ExamplePermission;
let otherSpacePermission: ExamplePermission;
let publicPermission: ExamplePermission;

let permissions: ExamplePermission[];

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
    userId: user.id,
    permissionLevel: 'maximum'
  };

  otherUserPermission = {
    userId: 'other-user-id',
    permissionLevel: 'minimum'
  };

  rolePermission = {
    roleId: role.id,
    permissionLevel: 'minimum'
  };

  otherRolePermission = {
    roleId: nonAssignedRole.id,
    permissionLevel: 'minimum'
  };

  spacePermission = {
    spaceId: space.id,
    permissionLevel: 'minimum'
  };

  otherSpacePermission = {
    spaceId: 'other-space-id',
    permissionLevel: 'minimum'
  };

  publicPermission = {
    public: true,
    permissionLevel: 'minimum'
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
