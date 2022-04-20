
import { getPage, IPageWithPermissions } from 'lib/pages';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { createPagePermission } from '../../page-permission-actions';
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

    const rootPermission = await createPagePermission({
      pageId: root.id,
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    await setupPermissionsAfterPagePermissionAdded(root.id);

    const [childWithPermissions, nestedChildWithPermissions, ultraNestedChildWithPermissions] = (await Promise.all([
      getPage(child.id),
      getPage(nestedChild.id),
      getPage(ultraNestedChild.id)
    ])) as IPageWithPermissions [];

    expect(childWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
    expect(nestedChildWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
    expect(ultraNestedChildWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPermission.id);
  });

});
