/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { Role, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { ExpectedAnError, InsecureOperationError } from '@packages/core/errors';
import type { TargetPermissionGroup } from '@packages/core/permissions';

import { SelfInheritancePermissionError } from '../errors';
import { upsertPagePermission } from '../upsertPagePermission';

let user: User;
let space: Space;
let role: Role;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
  role = await testUtilsMembers.generateRole({
    spaceId: space.id,
    createdBy: user.id
  });
});

describe('upsertPagePermission', () => {
  it('should create a permission for a page', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const createdPermission = await upsertPagePermission({
      pageId: page.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    expect(createdPermission).toBeDefined();
  });

  it('should overwrite an existing permission for a page', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await upsertPagePermission({
      pageId: page.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const updatedPermission = await upsertPagePermission({
      pageId: page.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const pagePermissionsForUser = await prisma.pagePermission.findMany({
      where: {
        pageId: page.id,
        userId: user.id
      }
    });

    expect(updatedPermission.permissionLevel).toBe('view');
    expect(pagePermissionsForUser.length).toBe(1);
  });
  it('should throw an error if an attempt to inherit a permission from itself happens', async () => {
    const parentPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPagePermission = await upsertPagePermission({
      pageId: parentPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    try {
      await upsertPagePermission({ pageId: parentPage.id, permission: parentPagePermission.id });
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(SelfInheritancePermissionError);
    }
  });

  it('should drop the inheritance reference if trying to inherit a permission from outside the parent tree', async () => {
    const parentPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPagePermission = await upsertPagePermission({
      pageId: parentPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: { group: 'user', id: user.id }
      }
    });

    const otherParent = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const newPermission = await upsertPagePermission({ pageId: otherParent.id, permission: parentPagePermission.id });

    expect(newPermission.sourcePermission).toBeNull();
  });

  it('should drop the inheritance reference if trying to inherit from a parent page that has more permissions', async () => {
    const parentPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPagePermission = await upsertPagePermission({
      pageId: parentPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: { group: 'user', id: user.id }
      }
    });

    const secondParentPagePermission = await upsertPagePermission({
      pageId: parentPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'role',
          id: role.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const newPermission = await upsertPagePermission({ pageId: child.id, permission: parentPagePermission.id });

    expect(newPermission.sourcePermission).toBeNull();
    expect((newPermission.assignee as TargetPermissionGroup<'user'>).id).toBe(
      (parentPagePermission.assignee as TargetPermissionGroup<'user'>).id
    );
  });

  it('should auto-add an inheritance reference if the value of the permission is the same as the parent and the child page can inherit from the parent page', async () => {
    const parentPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPagePermission = await upsertPagePermission({
      pageId: parentPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: { group: 'user', id: user.id }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const parentPageUserPermission = await upsertPagePermission({
      pageId: parentPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: { group: 'user', id: user.id }
      }
    });

    const newPermission = await upsertPagePermission({ pageId: child.id, permission: parentPageUserPermission.id });

    expect(newPermission.sourcePermission?.id).toBe(parentPagePermission.id);
    expect((newPermission.assignee as TargetPermissionGroup<'user'>).id).toBe(
      (parentPagePermission.assignee as TargetPermissionGroup<'user'>).id
    );
  });

  it('should not auto-add an inheritance reference if the page could inherit from its parent, but the value of the new permission is different', async () => {
    const parentPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const parentPagePermission = await upsertPagePermission({
      pageId: parentPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: { group: 'user', id: user.id }
      }
    });

    const childPagePermission = await upsertPagePermission({
      pageId: childPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: { group: 'user', id: user.id }
      }
    });

    const rootRolePermission = await upsertPagePermission({
      pageId: parentPage.id,
      permission: {
        permissionLevel: 'view',
        assignee: { group: 'role', id: role.id }
      }
    });

    // Higher access level, which means we could potentially inherit
    const childRolePermission = await upsertPagePermission({
      pageId: childPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: { group: 'role', id: role.id }
      }
    });

    expect(childPagePermission.sourcePermission?.id).toBe(parentPagePermission.id);
    expect(childRolePermission.sourcePermission).toBe(null);
  });

  it('should specify which permission the permission was inherited from when created', async () => {
    const parent = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await upsertPagePermission({
      pageId: parent.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const created = await upsertPagePermission({ pageId: child.id, permission: parentPermission.id });

    expect(created.sourcePermission?.id).toBe(parentPermission.id);
  });

  it('should delete the reference to the page the permission was inherited from if not provided in upsert mode', async () => {
    const parent = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await upsertPagePermission({
      pageId: parent.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const created = await upsertPagePermission({ pageId: child.id, permission: parentPermission.id });

    const updated = await upsertPagePermission({
      pageId: child.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    expect(updated.sourcePermission).toBeNull();
  });

  it('should update the permissions that inherit from an existing permission when updated', async () => {
    const parent = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await upsertPagePermission({
      pageId: parent.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const createdChild = await upsertPagePermission({ pageId: child.id, permission: parentPermission.id });

    const updatedParent = await upsertPagePermission({
      pageId: parent.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const updatedChild = await prisma.pagePermission.findUnique({
      where: {
        id: createdChild.id
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updatedChild!.permissionLevel).toBe(updatedParent.permissionLevel);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updatedChild!.inheritedFromPermission).toBe(updatedParent.id);
  });

  it('should not update the permissions that inherit from an existing permission, where the related page is a sibling', async () => {
    const parent = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await upsertPagePermission({
      pageId: parent.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const childPermission = await upsertPagePermission({ pageId: child.id, permission: parentPermission.id });

    const sibling = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const siblingPermission = await upsertPagePermission({ pageId: sibling.id, permission: parentPermission.id });

    const subChild = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChildPermission = await upsertPagePermission({ pageId: subChild.id, permission: childPermission.id });

    await upsertPagePermission({
      pageId: child.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const siblingPermissionAfterUpdate = await prisma.pagePermission.findUnique({
      where: {
        id: siblingPermission.id
      }
    });

    const childPermissionAfterUpdate = await prisma.pagePermission.findUnique({
      where: {
        id: childPermission.id
      }
    });

    const subChildPermissionAfterUpdate = await prisma.pagePermission.findUnique({
      where: {
        id: subChildPermission.id
      }
    });

    expect(childPermissionAfterUpdate!.inheritedFromPermission).toBeNull();
    expect(subChildPermissionAfterUpdate!.inheritedFromPermission).toBe(childPermissionAfterUpdate!.id);
    expect(siblingPermissionAfterUpdate!.inheritedFromPermission).toBe(parentPermission.id);
  });

  it('should not create a permission for another space than the space the page belongs to', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const { space: differentSpace } = await testUtilsUser.generateUserAndSpace();

    try {
      await upsertPagePermission({
        pageId: page.id,
        permission: { permissionLevel: 'full_access', assignee: { group: 'space', id: differentSpace.id } }
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

  it('should not create a permission for a role that is outside the space the page belongs to', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const { space: differentSpace, user: userFromDifferentSpace } = await testUtilsUser.generateUserAndSpace();

    const differentSpaceRole = await testUtilsMembers.generateRole({
      createdBy: userFromDifferentSpace.id,
      spaceId: differentSpace.id
    });

    try {
      await upsertPagePermission({
        pageId: page.id,
        permission: { permissionLevel: 'full_access', assignee: { group: 'role', id: differentSpaceRole.id } }
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

  it('should not create a permission for a user who is not a member of the space the page belongs to', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const { user: userFromDifferentSpace } = await testUtilsUser.generateUserAndSpace();

    try {
      await upsertPagePermission({
        pageId: page.id,
        permission: { permissionLevel: 'full_access', assignee: { group: 'user', id: userFromDifferentSpace.id } }
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });
});
