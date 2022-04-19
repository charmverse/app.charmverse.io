/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Space, User } from '@prisma/client';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { ExpectedAnError } from 'testing/errors';
import { getPage } from 'lib/pages';
import { createPagePermission, inheritPermissions } from '../page-permission-actions';
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
    expect(rootWithPermissions?.permissions.length).toBe(2);
    // Inherited permission
    expect(childWithPermissions?.permissions.some(perm => perm.permissionLevel === 'full_access' && perm.userId === user.id)).toBe(true);
    // Locally defined permission should not have been overwritten
    expect(childWithPermissions?.permissions.some(perm => perm.permissionLevel === 'view_comment' && perm.spaceId === space.id && perm.inheritedFromPermission === null)).toBe(true);

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
