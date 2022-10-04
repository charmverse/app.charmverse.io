
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
import { ExpectedAnError } from 'testing/errors';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { upsertPermission, deletePagePermission } from '..';
import { PermissionNotFoundError } from '../../errors';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('deletePagePermission', () => {

  it('should delete only the target permission for that page', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermissions = await Promise.all([
      upsertPermission(
        page.id,
        {
          permissionLevel: 'full_access',
          userId: user.id
        }
      ),
      upsertPermission(page.id, {
        permissionLevel: 'view',
        spaceId: space.id
      })
    ]);

    await deletePagePermission(rootPermissions[0].id);

    const remainingPermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: page.id
      }
    });

    expect(remainingPermissions.length).toBe(1);

  });

  it('should delete any permissions on other pages inherited from it', async () => {
    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const rootFullAccessPermission = await upsertPermission(
      root.id,
      {
        permissionLevel: 'full_access',
        userId: user.id
      }
    );

    const childFullAccessPermission = await upsertPermission(child.id, rootFullAccessPermission.id);

    const rootViewPermission = await upsertPermission(
      root.id,
      {
        permissionLevel: 'view',
        spaceId: space.id
      }
    );

    const childViewPermission = await upsertPermission(child.id, rootViewPermission);

    await deletePagePermission(rootFullAccessPermission.id);

    const remainingChildPermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: child.id
      }
    });

    expect(remainingChildPermissions.length).toBe(1);

  });

  it('should throw an error if no permission exists', async () => {
    try {
      await deletePagePermission(v4());
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(PermissionNotFoundError);
    }
  });

  it('should delete an inherited permission from all child pages, but leave the parent pages that inherit this permission untouched', async () => {

    const rootPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Root'
    });

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: rootPage.id,
      title: 'Child'
    });

    const nestedChildPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: childPage.id,
      title: 'Nested'
    });

    const superNestedChildPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: nestedChildPage.id,
      title: 'Nested'
    });

    const rootPermission = await upsertPermission(rootPage.id, {
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const rootPermissionId = rootPermission.id;

    await Promise.all([
      upsertPermission(childPage.id, rootPermissionId),
      upsertPermission(nestedChildPage.id, rootPermissionId),
      upsertPermission(superNestedChildPage.id, rootPermissionId)
    ]);

    const nestedChildWithPermissions = (await getPage(nestedChildPage.id) as IPageWithPermissions);

    await deletePagePermission(nestedChildWithPermissions.permissions[0].id);

    const remainingPermissions = await prisma.pagePermission.findMany({
      where: {
        OR: [
          {
            id: rootPermissionId
          },
          {
            inheritedFromPermission: rootPermissionId
          }
        ]
      }
    });

    // Nested and Super nested shouldn't have the permission
    expect(remainingPermissions.length).toBe(2);

    const [rootWithPermissions, childWithPermissions] = (await Promise.all([
      getPage(rootPage.id),
      getPage(childPage.id)
    ]) as IPageWithPermissions[]);

    expect(rootWithPermissions.permissions.some(perm => perm.id === rootPermissionId));
    expect(childWithPermissions.permissions.some(perm => perm.inheritedFromPermission === rootPermissionId));

  });

});
