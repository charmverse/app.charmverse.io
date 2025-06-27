import type { PagePermission } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { resolvePageTree } from '@packages/core/pages';

import { handlePageRepositioned } from '../handlePageRespositioned';
import { upsertPagePermission } from '../upsertPagePermission';

/**
 * For now, these tests are 1:1 with breakInheritance as setupPermissionsAfterPageBecameRoot has no further needs than breakInheritance
 */
describe('handlePageRepositioned / page became root', () => {
  it('should convert all permissions inherited by the page to permissions owned by the page', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const root = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await upsertPagePermission({
      pageId: root.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await upsertPagePermission({ pageId: child.id, permission: rootPermission.id });

    // Set the child to have no parent
    await prisma.page.update({
      where: {
        id: child.id
      },
      data: {
        parentId: null
      }
    });

    const updatedPage = await handlePageRepositioned({ pageId: child.id });

    expect(updatedPage.permissions.length).toBe(1);
    expect(updatedPage.permissions[0].permissionLevel).toBe('full_access');
    expect(updatedPage.permissions[0].inheritedFromPermission).toBeNull();
  });

  it('should update inherited permissions for child pages of the page to now inherit from this page', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const root = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await upsertPagePermission({
      pageId: root.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await upsertPagePermission({ pageId: child.id, permission: rootPermission.id });

    const subChild1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild1Permission = await upsertPagePermission({ pageId: subChild1.id, permission: rootPermission.id });

    const subChild2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild2Permission = await upsertPagePermission({ pageId: subChild2.id, permission: rootPermission.id });

    const subSubChild1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubChild1Permission = await upsertPagePermission({ pageId: subChild1.id, permission: rootPermission.id });

    // Set the child to have no parent
    await prisma.page.update({
      where: {
        id: child.id
      },
      data: {
        parentId: null
      }
    });

    await handlePageRepositioned({ pageId: child.id });

    const { targetPage, flatChildren: childPages } = await resolvePageTree({ pageId: child.id, flattenChildren: true });

    childPages.forEach((nestedPage) => {
      nestedPage.permissions.forEach((nestedPagePermission) => {
        expect(nestedPagePermission.inheritedFromPermission).toBe(childPermission.id);
      });
    });
  });

  it('should leave the locally defined permissions for child pages unchanged', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const root = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await upsertPagePermission({
      pageId: root.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await upsertPagePermission({ pageId: child.id, permission: rootPermission.id });

    const subChild1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild1Permission = await upsertPagePermission({ pageId: subChild1.id, permission: rootPermission.id });
    const subChild1LocalPermission = await upsertPagePermission({
      pageId: subChild1.id,
      permission: {
        permissionLevel: 'editor',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    // Set the child to have no parent
    await prisma.page.update({
      where: {
        id: child.id
      },
      data: {
        parentId: null
      }
    });

    await handlePageRepositioned({ pageId: child.id });

    const nestedPage = await testUtilsPages.getPageWithPermissions(subChild1.id);

    expect(nestedPage.permissions.length).toBe(2);

    const stillHasLocalPermission = nestedPage.permissions.some((permission) => {
      return permission.userId === user.id && permission.inheritedFromPermission === null;
    });

    expect(stillHasLocalPermission).toBe(true);
  });
});

describe('handlePageRepositioned / page repositioned below other page', () => {
  it('should establish an inheritance link with the parent if it has at least the same amount of permissions', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const root = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await upsertPagePermission({
      pageId: root.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    const root2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const root2Permission = await upsertPagePermission({
      pageId: root2.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    const root2UserPermission = await upsertPagePermission({
      pageId: root2.id,
      permission: {
        permissionLevel: 'editor',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await upsertPagePermission({ pageId: child.id, permission: rootPermission.id });

    const secondChildPermission = await upsertPagePermission({
      pageId: child.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    // Set the child to have no parent
    await prisma.page.update({
      where: {
        id: child.id
      },
      data: {
        parentId: root2.id
      }
    });

    const updatedPage = await handlePageRepositioned({ pageId: child.id });

    expect(updatedPage.permissions.length).toBe(2);

    const childSpacePermission = updatedPage.permissions.find(
      (permission) => permission.spaceId === space.id
    ) as PagePermission;

    const childUserPermission = updatedPage.permissions.find(
      (permission) => permission.userId === user.id
    ) as PagePermission;

    // Permission is same as parent, so we can update it to inherit from there
    expect(childSpacePermission.permissionLevel).toBe('full_access');
    expect(childSpacePermission.inheritedFromPermission).toBe(root2Permission.id);

    // The permission should have been maintained without modification or inheritance
    expect(childUserPermission.permissionLevel).toBe('full_access');
    expect(childUserPermission.inheritedFromPermission).toBeNull();
  });
});
