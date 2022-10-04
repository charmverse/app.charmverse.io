
import type { PagePermissionLevel, User } from '@prisma/client';
import { PageOperations } from '@prisma/client';
import { v4 } from 'uuid';

import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { PageOperationType } from '../page-permission-interfaces';

let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
});

describe('computeUserPagePermissions', () => {

  it('should return the correct permissions for a user by combining all permissions they are eligible for', async () => {

    const { user: adminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    await Promise.all([
      upsertPermission(page.id, {
        permissionLevel: 'view',
        pageId: page.id,
        spaceId: localSpace.id
      }),
      upsertPermission(page.id, {
        permissionLevel: 'view_comment',
        pageId: page.id,
        userId: adminUser.id
      })
    ]);

    const permissions = await computeUserPagePermissions({
      pageId: page.id,
      userId: adminUser.id
    });

    const assignedPermissionLevels: PagePermissionLevel[] = ['view', 'view_comment'];

    assignedPermissionLevels.forEach(group => {
      permissionTemplates[group].forEach(op => {
        expect(permissions[op]).toBe(true);
      });
    });

    // Check a random higher level operation that shouldn't be true
    expect(permissions.grant_permissions).toBe(false);
  });

  it('should return full permissions if the user is an admin of the space linked to the page', async () => {

    const { user: adminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const page = await createPage({
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    const permissions = await computeUserPagePermissions({
      pageId: page.id,
      userId: adminUser.id
    });

    (Object.keys(PageOperations) as PageOperationType[]).forEach(op => {
      expect(permissions[op]).toBe(true);
    });

  });

  it('should return only permissions an admin user has been explicity assigned if allowAdminBypass is set to false', async () => {

    const { user: adminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const page = await createPage({
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    await upsertPermission(page.id, {
      permissionLevel: 'view',
      pageId: page.id,
      userId: adminUser.id
    });

    const permissions = await computeUserPagePermissions({
      pageId: page.id,
      userId: adminUser.id,
      allowAdminBypass: false
    });

    (Object.keys(PageOperations) as PageOperationType[]).forEach(op => {
      if (op === 'read') {
        expect(permissions.read).toBe(true);
      }
      else {
        expect(permissions[op]).toBe(false);
      }
    });

  });

  it('should return empty permissions if the page does not exist', async () => {
    const inexistentPageId = v4();

    const permissions = await computeUserPagePermissions({
      pageId: inexistentPageId,
      userId: user.id
    });

    (Object.keys(PageOperations) as PageOperationType[]).forEach(op => {
      expect(permissions[op]).toBe(false);
    });

  });

  it('should return only public permissions if no user is provided', async () => {

    const { user: nonAdminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const page = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    await Promise.all([
      upsertPermission(page.id, {
        spaceId: localSpace.id,
        permissionLevel: 'full_access'
      }),
      upsertPermission(page.id, {
        public: true,
        permissionLevel: 'view'
      })
    ]);

    const permissions = await computeUserPagePermissions({
      pageId: page.id
    });

    permissionTemplates.view.forEach(op => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.grant_permissions).toBe(false);
    expect(permissions.edit_content).toBe(false);

  });

});
