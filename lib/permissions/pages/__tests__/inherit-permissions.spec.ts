/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Space, User } from '@prisma/client';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { ExpectedAnError } from 'testing/errors';
import { getPage } from 'lib/pages';
import { createPagePermission, inheritPermissions, inheritPermissionsAcrossChildren } from '../page-permission-actions';
import { CannotInheritOutsideTreeError, CircularPermissionError, InvalidPermissionGranteeError, SelfInheritancePermissionError } from '../errors';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('inheritPermissions', () => {
  it('should assign all permissions from a source page to a target page', async () => {
    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    await createPagePermission({
      pageId: root.id,
      permissionLevel: 'view',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    await inheritPermissions(root.id, child.id);

    const [rootWithPermissions, childWithPermissions] = await Promise.all([
      getPage(root.id),
      getPage(child.id)
    ]);

    expect(childWithPermissions?.permissions.length).toBe(rootWithPermissions?.permissions.length);
    expect(childWithPermissions?.permissions.some(perm => perm.permissionLevel === 'full_access' && perm.userId === user.id)).toBe(true);
    expect(childWithPermissions?.permissions.some(perm => perm.permissionLevel === 'view' && perm.spaceId === space.id)).toBe(true);

  });

  it('should pass the reference of permissions the source page inherits from', async () => {
    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    await inheritPermissions(root.id, child.id);

    const nestedChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const nestedChildWithPermissions = await inheritPermissions(child.id, nestedChild.id);

    expect(nestedChildWithPermissions?.permissions[0].inheritedFromPermission).toBe(rootPermission.id);

  });

  it('should not overwrite existing permissions in the target page', async () => {
    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    await createPagePermission({
      pageId: root.id,
      permissionLevel: 'view',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    await createPagePermission({
      pageId: child.id,
      permissionLevel: 'view_comment',
      spaceId: space.id
    });

    await inheritPermissions(root.id, child.id);

    const [rootWithPermissions, childWithPermissions] = await Promise.all([
      getPage(root.id),
      getPage(child.id)
    ]);

    expect(rootWithPermissions?.permissions.length).toBe(2);
    expect(childWithPermissions?.permissions.length).toBe(2);
    // Inherited permission
    expect(childWithPermissions?.permissions.some(perm => perm.permissionLevel === 'full_access' && perm.userId === user.id)).toBe(true);
    // Locally defined permission should not have been overwritten
    expect(childWithPermissions?.permissions.some(perm => perm.permissionLevel === 'view_comment' && perm.spaceId === space.id && perm.inheritedFromPermission === null)).toBe(true);

  });

  it('should replace existing permissions in the target page if they have the same level and group as the parent page', async () => {

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootUserFullAccessPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    const spaceViewPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'view',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    await createPagePermission({
      pageId: child.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    await createPagePermission({
      pageId: child.id,
      permissionLevel: 'view',
      spaceId: space.id
    });

    await inheritPermissions(root.id, child.id);

    const [rootWithPermissions, childWithPermissions] = await Promise.all([
      getPage(root.id),
      getPage(child.id)
    ]);

    expect(rootWithPermissions?.permissions.length).toBe(2);
    expect(rootWithPermissions?.permissions.length).toBe(2);
    // Inherited permission
    expect(childWithPermissions?.permissions.some(perm => perm.permissionLevel === 'full_access' && perm.userId === user.id && perm.inheritedFromPermission === rootUserFullAccessPermission.id)).toBe(true);
    // Locally defined permission should not have been overwritten
    expect(childWithPermissions?.permissions.some(perm => perm.permissionLevel === 'view' && perm.spaceId === space.id && perm.inheritedFromPermission === spaceViewPermission.id)).toBe(true);

  });

  it('should throw an error if the target cannot inherit from the source because it is not a child', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await createPagePermission({
      pageId: page.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    const siblingPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    try {
      await inheritPermissions(page.id, siblingPage.id);
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(CannotInheritOutsideTreeError);
    }
  });
});

describe('inheritPermissionsAcrossChildren', () => {

  it('should replace existing permissions in the target page if they have the same level and group as the parent page, and cascade this parent inheritance to children of the target page that inherited from the target page', async () => {
    console.log(process.env.DATABASE_URL);
    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Root'
    });

    const rootUserFullAccessPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    const spaceViewPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'view',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id,
      title: 'Child'
    });

    const nestedChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id,
      title: 'Nested child'
    });

    // Copy over the permissions to nested child, with child as source
    // await inheritPermissions(child.id, nestedChild.id);

    // Make child now inherit from root
    await inheritPermissionsAcrossChildren(root.id, child.id);

    const [rootWithPermissions, nestedChildWithPermissions] = await Promise.all([
      getPage(root.id),
      getPage(nestedChild.id)
    ]);

    expect(rootWithPermissions?.permissions.length).toBe(2);
    expect(rootWithPermissions?.permissions.length).toBe(2);
    // Inherited permission
    expect(nestedChildWithPermissions?.permissions.some(perm => perm.permissionLevel === 'full_access' && perm.userId === user.id && perm.inheritedFromPermission === rootUserFullAccessPermission.id)).toBe(true);
    // Locally defined permission should not have been overwritten
    expect(nestedChildWithPermissions?.permissions.some(perm => perm.permissionLevel === 'view' && perm.spaceId === space.id && perm.inheritedFromPermission === spaceViewPermission.id)).toBe(true);

  });
});
