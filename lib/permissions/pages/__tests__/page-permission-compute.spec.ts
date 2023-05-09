import type { PagePermissionLevel, Space, User } from '@charmverse/core/prisma';
import { PageOperations } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { PageNotFoundError } from 'lib/pages/server';
import {
  AllowedPagePermissions,
  computeUserPagePermissions,
  permissionTemplates,
  upsertPermission
} from 'lib/permissions/pages';
import { convertPageToProposal } from 'lib/proposal/convertPageToProposal';
import { typedKeys } from 'lib/utilities/objects';
import {
  createPage,
  generateRole,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import type { PageOperationType } from '../page-permission-interfaces';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('computeUserPagePermissions', () => {
  // This test exists so we can apply a certain permission level to the space, but make it higher or lower for a user
  it('should apply permissions to the user in priority of user, role and space', async () => {
    const localUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const otherLocalUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    // Perform the test with a page that has role / space / permissions ----------------------------
    const firstPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [localUser.id]
    });

    await Promise.all([
      upsertPermission(firstPage.id, {
        permissionLevel: 'full_access',
        spaceId: space.id
      }),
      upsertPermission(firstPage.id, {
        permissionLevel: 'view_comment',
        roleId: role.id
      })
    ]);

    const firstPagePermissions = await computeUserPagePermissions({
      resourceId: firstPage.id,
      userId: localUser.id
    });

    // Check that the level assigned to the role was used in the compute
    typedKeys(PageOperations).forEach((op) => {
      if (permissionTemplates.view_comment.includes(op)) {
        expect(firstPagePermissions[op]).toBe(true);
      } else {
        expect(firstPagePermissions[op]).toBe(false);
      }
    });

    // Check that other space members not belonging to the role continue to receive the space level permissions
    const otherFirstPagePermissions = await computeUserPagePermissions({
      resourceId: firstPage.id,
      userId: otherLocalUser.id
    });

    typedKeys(PageOperations).forEach((op) => {
      expect(otherFirstPagePermissions[op]).toBe(true);
    });

    // Perform the test with a page that has user/ role / space / permissions ----------------------------
    const secondPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await Promise.all([
      upsertPermission(secondPage.id, {
        permissionLevel: 'view_comment',
        pageId: secondPage.id,
        spaceId: space.id
      }),
      upsertPermission(secondPage.id, {
        permissionLevel: 'full_access',
        pageId: secondPage.id,
        roleId: role.id
      }),
      upsertPermission(secondPage.id, {
        permissionLevel: 'view',
        pageId: secondPage.id,
        userId: localUser.id
      })
    ]);

    const permissions = await computeUserPagePermissions({
      resourceId: secondPage.id,
      userId: localUser.id
    });

    // Check that the level assigned to the role was used in the compute
    typedKeys(PageOperations).forEach((op) => {
      if (permissionTemplates.view.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });

    // Check that other space members are receiving the space level permissions
    const otherPermissions = await computeUserPagePermissions({
      resourceId: secondPage.id,
      userId: otherLocalUser.id
    });

    typedKeys(PageOperations).forEach((op) => {
      if (permissionTemplates.view_comment.includes(op)) {
        expect(otherPermissions[op]).toBe(true);
      } else {
        expect(otherPermissions[op]).toBe(false);
      }
    });
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

  it('should only take into account individually assigned permissions for guest users', async () => {
    const { user: nonAdminUser, space: localSpace } = await generateUserAndSpace({});

    const guest = await generateSpaceUser({
      spaceId: localSpace.id,
      isGuest: true
    });

    const pageWithoutGuestPermissions = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    await Promise.all([
      upsertPermission(pageWithoutGuestPermissions.id, {
        spaceId: localSpace.id,
        permissionLevel: 'full_access'
      })
    ]);

    const permissions = await computeUserPagePermissions({
      resourceId: pageWithoutGuestPermissions.id,
      userId: guest.id
    });

    typedKeys(PageOperations).forEach((op) => {
      expect(permissions[op]).toBe(false);
    });

    // Now add a permission for the guest user and check that it is taken into account
    const pageWithGuestPermissions = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    // Situation where guest has full access, but space members do not
    await Promise.all([
      upsertPermission(pageWithGuestPermissions.id, {
        spaceId: localSpace.id,
        permissionLevel: 'view'
      }),
      upsertPermission(pageWithGuestPermissions.id, {
        userId: guest.id,
        permissionLevel: 'full_access'
      })
    ]);

    const guestPermissions = await computeUserPagePermissions({
      resourceId: pageWithGuestPermissions.id,
      userId: guest.id
    });

    permissionTemplates.full_access.forEach((op) => {
      expect(guestPermissions[op]).toBe(true);
    });
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

  it('should take into account public permissions for a guest user', async () => {
    const guest = await generateSpaceUser({
      isGuest: true,
      spaceId: space.id
    });

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          public: true,
          permissionLevel: 'view'
        }
      ]
    });

    const permissions = await computeUserPagePermissions({
      resourceId: page.id,
      userId: guest.id
    });

    expect(permissions).toMatchObject(
      expect.objectContaining({
        ...new AllowedPagePermissions().empty,
        read: true
      })
    );
  });
});
