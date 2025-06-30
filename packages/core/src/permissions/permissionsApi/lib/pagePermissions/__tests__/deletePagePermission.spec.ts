import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsPages } from '@charmverse/core/test';
import { ExpectedAnError } from '@packages/core/errors';
import { v4 } from 'uuid';

import { deletePagePermission } from '../deletePagePermission';
import { PagePermissionNotFoundError } from '../errors';
import { upsertPagePermission } from '../upsertPagePermission';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('deletePagePermission', () => {
  it('should delete only the target permission for that page', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermissions = await Promise.all([
      upsertPagePermission({
        pageId: page.id,
        permission: {
          permissionLevel: 'full_access',
          assignee: {
            group: 'user',
            id: user.id
          }
        }
      }),
      upsertPagePermission({
        pageId: page.id,
        permission: {
          permissionLevel: 'view',
          assignee: {
            group: 'space',
            id: space.id
          }
        }
      })
    ]);

    await deletePagePermission({ permissionId: rootPermissions[0].id });

    const remainingPermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: page.id
      }
    });

    expect(remainingPermissions.length).toBe(1);
  });

  it('should delete any permissions on other pages inherited from it', async () => {
    const root = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const rootFullAccessPermission = await upsertPagePermission({
      pageId: root.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const childFullAccessPermission = await upsertPagePermission({
      pageId: child.id,
      permission: rootFullAccessPermission.id
    });

    const rootViewPermission = await upsertPagePermission({
      pageId: root.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    const childViewPermission = await upsertPagePermission({ pageId: child.id, permission: rootViewPermission });

    await deletePagePermission({ permissionId: rootFullAccessPermission.id });

    const remainingChildPermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: child.id
      }
    });

    expect(remainingChildPermissions.length).toBe(1);
  });

  it('should throw an error if no permission exists', async () => {
    try {
      await deletePagePermission({ permissionId: v4() });
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(PagePermissionNotFoundError);
    }
  });

  it('should delete an inherited permission from all child pages, but leave the parent pages that inherit this permission untouched', async () => {
    const rootPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Root'
    });

    const childPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: rootPage.id,
      title: 'Child'
    });

    const nestedChildPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: childPage.id,
      title: 'Nested'
    });

    const superNestedChildPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: nestedChildPage.id,
      title: 'Nested'
    });

    const rootPermission = await upsertPagePermission({
      pageId: rootPage.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    const rootPermissionId = rootPermission.id;

    await Promise.all([
      upsertPagePermission({ pageId: childPage.id, permission: rootPermissionId }),
      upsertPagePermission({ pageId: nestedChildPage.id, permission: rootPermissionId }),
      upsertPagePermission({ pageId: superNestedChildPage.id, permission: rootPermissionId })
    ]);

    const nestedChildWithPermissions = await testUtilsPages.getPageWithPermissions(nestedChildPage.id);

    await deletePagePermission({ permissionId: nestedChildWithPermissions.permissions[0].id });

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

    const [rootWithPermissions, childWithPermissions] = await Promise.all([
      testUtilsPages.getPageWithPermissions(rootPage.id),
      testUtilsPages.getPageWithPermissions(childPage.id)
    ]);

    expect(rootWithPermissions.permissions.some((perm) => perm.id === rootPermissionId));
    expect(childWithPermissions.permissions.some((perm) => perm.inheritedFromPermission === rootPermissionId));
  });
});
