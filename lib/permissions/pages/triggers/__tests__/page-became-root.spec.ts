
import type { PagePermission } from '@prisma/client';

import { prisma } from 'db';
import { flattenTree } from 'lib/pages/mapPageTree';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
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

    const { targetPage } = await resolvePageTree({ pageId: child.id });
    const childPages = flattenTree(targetPage);

    childPages.forEach(nestedPage => {
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

describe('setupPermissionsAfterPageRepositioned / page repositioned below other page', () => {
  it('should establish an inheritance link with the parent if it has at least the same amount of permissions', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermission = await upsertPermission(root.id, {
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const root2 = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const root2Permission = await upsertPermission(root2.id, {
      permissionLevel: 'full_access',
      spaceId: space.id
    });

    const root2UserPermission = await upsertPermission(root2.id, {
      permissionLevel: 'editor',
      userId: user.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const childPermission = await upsertPermission(child.id, rootPermission.id);

    const secondChildPermission = await upsertPermission(child.id, {
      permissionLevel: 'full_access',
      userId: user.id
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

    const updatedPage = await setupPermissionsAfterPageRepositioned(child.id);

    expect(updatedPage.permissions.length).toBe(2);

    const childSpacePermission = updatedPage.permissions.find(permission => permission.spaceId === space.id) as PagePermission;

    const childUserPermission = updatedPage.permissions.find(permission => permission.userId === user.id) as PagePermission;

    // Permission is same as parent, so we can update it to inherit from there
    expect(childSpacePermission.permissionLevel).toBe('full_access');
    expect(childSpacePermission.inheritedFromPermission).toBe(root2Permission.id);

    // The permission should have been maintained without modification or inheritance
    expect(childUserPermission.permissionLevel).toBe('full_access');
    expect(childUserPermission.inheritedFromPermission).toBeNull();

  });

});
