import { testUtilsUser, testUtilsPages } from '@charmverse/core/test';
import type { PageWithPermissions } from '@packages/core/pages';

import { handlePagePermissionAdded } from '../handlePagePermissionAdded';
import { upsertPagePermission } from '../upsertPagePermission';

/**
 * For now, these tests are 1:1 with breakInheritance as setupPermissionsAfterPageBecameRoot has no further needs than breakInheritance
 */
describe('handlePagePermissionAdded', () => {
  it('should assign a new permission to all children', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const root = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const nestedChild = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const ultraNestedChild = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
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

    await handlePagePermissionAdded({ permissionId: rootPermission.id });

    const [childWithPermissions, nestedChildWithPermissions, ultraNestedChildWithPermissions] = (await Promise.all([
      testUtilsPages.getPageWithPermissions(child.id),
      testUtilsPages.getPageWithPermissions(nestedChild.id),
      testUtilsPages.getPageWithPermissions(ultraNestedChild.id)
    ])) as PageWithPermissions[];

    expect(childWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
    expect(nestedChildWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
    expect(ultraNestedChildWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
  });

  it('should not assign a new permission to a subtree if the top node of any subtree does not have at least the same amount of permissions as the parent', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const root = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const nestedChild = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const superNestedChild = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: nestedChild.id
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

    await handlePagePermissionAdded({ permissionId: rootPermission.id });

    // Downgrade the permission on nested
    await upsertPagePermission({
      pageId: nestedChild.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    // Add new permission above in child
    const newChildPermission = await upsertPagePermission({
      pageId: child.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'user',
          id: user.id
        }
      }
    });

    await handlePagePermissionAdded({ permissionId: newChildPermission.id });

    const [nestedChildWithPermissions, superNestedChildWithPermissions] = (await Promise.all([
      testUtilsPages.getPageWithPermissions(nestedChild.id),
      testUtilsPages.getPageWithPermissions(superNestedChild.id)
    ])) as PageWithPermissions[];

    const nestedHasSinglePermission = nestedChildWithPermissions.permissions.length === 1;
    const superNestedHasSinglePermission = superNestedChildWithPermissions.permissions.length === 1;

    expect(nestedHasSinglePermission).toBe(true);
    expect(superNestedHasSinglePermission).toBe(true);
  });
});
