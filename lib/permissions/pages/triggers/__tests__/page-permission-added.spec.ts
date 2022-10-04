
import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { upsertPermission } from '../../actions/upsert-permission';
import { setupPermissionsAfterPagePermissionAdded } from '../page-permission-added';

/**
 * For now, these tests are 1:1 with breakInheritance as setupPermissionsAfterPageBecameRoot has no further needs than breakInheritance
 */
describe('setupPermissionsAfterPagePermissionAdded', () => {
  it('should assign a new permission to all children', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const nestedChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const ultraNestedChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const rootPermission = await upsertPermission(root.id, {
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    await setupPermissionsAfterPagePermissionAdded(rootPermission.id);

    const [childWithPermissions, nestedChildWithPermissions, ultraNestedChildWithPermissions] = (await Promise.all([
      getPage(child.id),
      getPage(nestedChild.id),
      getPage(ultraNestedChild.id)
    ])) as IPageWithPermissions [];

    expect(childWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
    expect(nestedChildWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
    expect(ultraNestedChildWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
  });

  it('should not assign a new permission to a subtree if the top node of any subtree does not have at least the same amount of permissions as the parent', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const nestedChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const superNestedChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: nestedChild.id
    });

    const rootPermission = await upsertPermission(root.id, {
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    await setupPermissionsAfterPagePermissionAdded(rootPermission.id);

    // Downgrade the permission on nested
    await upsertPermission(nestedChild.id, {
      spaceId: space.id,
      permissionLevel: 'view'
    });

    // Add new permission above in child
    const newChildPermission = await upsertPermission(child.id, {
      userId: user.id,
      permissionLevel: 'view'
    });

    await setupPermissionsAfterPagePermissionAdded(newChildPermission.id);

    const [nestedChildWithPermissions, superNestedChildWithPermissions] = (await Promise.all([
      getPage(nestedChild.id),
      getPage(superNestedChild.id)
    ])) as IPageWithPermissions [];

    const nestedHasSinglePermission = nestedChildWithPermissions.permissions.length === 1;
    const superNestedHasSinglePermission = superNestedChildWithPermissions.permissions.length === 1;

    expect(nestedHasSinglePermission).toBe(true);
    expect(superNestedHasSinglePermission).toBe(true);

  });

});
