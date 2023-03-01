import type { PagePermissionLevel, User } from '@prisma/client';
import { PageOperations } from '@prisma/client';
import { v4 } from 'uuid';

import { PageNotFoundError } from 'lib/pages/server';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { convertPageToProposal } from 'lib/proposal/convertPageToProposal';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import type { PageOperationType } from '../page-permission-interfaces';

let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
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
      resourceId: page.id,
      userId: adminUser.id
    });

    const assignedPermissionLevels: PagePermissionLevel[] = ['view', 'view_comment'];

    assignedPermissionLevels.forEach((group) => {
      permissionTemplates[group].forEach((op) => {
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
      resourceId: page.id,
      userId: adminUser.id
    });

    (Object.keys(PageOperations) as PageOperationType[]).forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
  });

  it('should throw an error if the page does not exist', async () => {
    const inexistentPageId = v4();

    await expect(
      computeUserPagePermissions({
        resourceId: inexistentPageId,
        userId: user.id
      })
    ).rejects.toBeInstanceOf(PageNotFoundError);
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
      resourceId: page.id
    });

    permissionTemplates.view.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.grant_permissions).toBe(false);
    expect(permissions.edit_content).toBe(false);
  });

  it('should return only read permissions if page has been converted to a proposal', async () => {
    const { user: nonAdminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const categoryName = 'Example category';

    const category = await generateProposalCategory({
      spaceId: localSpace.id,
      title: categoryName
    });

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

    await convertPageToProposal({
      page,
      categoryId: category.id,
      userId: nonAdminUser.id
    });

    const permissions = await computeUserPagePermissions({
      resourceId: page.id,
      userId: nonAdminUser.id
    });

    permissionTemplates.view.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.grant_permissions).toBe(false);
    expect(permissions.edit_content).toBe(false);
  });
});
