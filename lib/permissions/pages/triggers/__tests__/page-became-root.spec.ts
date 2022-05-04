
import { prisma } from 'db';
import { getPage, IPageWithPermissions, resolveChildPagesAsFlatList } from 'lib/pages/server';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { upsertPermission } from '../../actions/upsert-permission';
import { setupPermissionsAfterPageRepositioned } from '../page-repositioned';

/**
 * For now, these tests are 1:1 with breakInheritance as setupPermissionsAfterPageBecameRoot has no further needs than breakInheritance
 */
describe('setupPermissionsAfterPageRepositioned / page became root', () => {
  it('should convert all permissions inherited by the page to permissions owned by the page', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await upsertPermission(root.id, {
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await upsertPermission(child.id, rootPermission.id);

    // Set the child to have no parent
    await prisma.page.update({
      where: {
        id: child.id
      },
      data: {
        parentId: null
      }
    });

    const updatedPage = await setupPermissionsAfterPageRepositioned(child.id);

    expect(updatedPage.permissions.length).toBe(1);
    expect(updatedPage.permissions[0].permissionLevel).toBe('full_access');
    expect(updatedPage.permissions[0].inheritedFromPermission).toBeNull();

  });

  it('should update inherited permissions for child pages of the page to now inherit from this page', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await upsertPermission(root.id, {
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await upsertPermission(child.id, rootPermission.id);

    const subChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild1Permission = await upsertPermission(subChild1.id, rootPermission.id);

    const subChild2 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild2Permission = await upsertPermission(subChild2.id, rootPermission.id);

    const subSubChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubChild1Permission = await upsertPermission(subChild1.id, rootPermission.id);

    // Set the child to have no parent
    await prisma.page.update({
      where: {
        id: child.id
      },
      data: {
        parentId: null
      }
    });

    await setupPermissionsAfterPageRepositioned(child.id);

    const children = await resolveChildPagesAsFlatList(child.id);

    children.forEach(nestedPage => {
      nestedPage.permissions.forEach(nestedPagePermission => {
        expect(nestedPagePermission.inheritedFromPermission).toBe(childPermission.id);

      });
    });
  });

  it('should leave the locally defined permissions for child pages unchanged', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await upsertPermission(root.id, {
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await upsertPermission(child.id, rootPermission.id);

    const subChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild1Permission = await upsertPermission(subChild1.id, rootPermission.id);
    const subChild1LocalPermission = await upsertPermission(subChild1.id, {
      permissionLevel: 'editor',
      userId: user.id
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

    await setupPermissionsAfterPageRepositioned(child.id);

    const nestedPage = await getPage(subChild1.id) as IPageWithPermissions;

    expect(nestedPage.permissions.length).toBe(2);

    const stillHasLocalPermission = nestedPage.permissions.some(permission => {
      return permission.userId === user.id && permission.inheritedFromPermission === null;
    });

    expect(stillHasLocalPermission).toBe(true);

  });
});
