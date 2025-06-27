import type { PagePermission, PagePermissionLevel, Space, User } from '@charmverse/core/prisma';
import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { PageNotFoundError, ExpectedAnError } from '@packages/core/errors';
import type { PageMetaWithPermissions, PageWithPermissions } from '@packages/core/pages';
import { v4 } from 'uuid';

import { toggleSpaceDefaultPublicPage } from 'lib/spacePermissions/toggleSpaceDefaultPublicPage';

import { deletePagePermission } from '../deletePagePermission';
import { handlePageCreated } from '../handlePageCreated';
import { upsertPagePermission } from '../upsertPagePermission';

let user1: User;
let spaceWithDefaultPagePermissionGroup: Space;
let user2: User;
let spaceWithoutDefaultPagePermissionGroup: Space;

beforeAll(async () => {
  const generated1 = await testUtilsUser.generateUserAndSpace();
  user1 = generated1.user;
  spaceWithDefaultPagePermissionGroup = await prisma.space.update({
    where: {
      id: generated1.space.id
    },
    data: {
      defaultPagePermissionGroup: 'view_comment'
    }
  });

  const generated2 = await testUtilsUser.generateUserAndSpace();
  user2 = generated2.user;
  spaceWithoutDefaultPagePermissionGroup = generated2.space;
});

describe('handlePageCreated', () => {
  it("should fail if the page doesn't exist", async () => {
    const id = v4();
    try {
      await handlePageCreated(id);
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toMatchObject(new PageNotFoundError(id));
    }
  });

  it('should assign full access to the user creating the page', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: spaceWithDefaultPagePermissionGroup.id
    });

    const pageWithPermissions = await handlePageCreated(page.id);

    expect(pageWithPermissions.permissions.some((p) => p.userId === user1.id && p.permissionLevel === 'full_access'));
  });

  it('should assign the space default page permission to a root page', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: spaceWithDefaultPagePermissionGroup.id
    });

    const pageWithPermissions = await handlePageCreated(page.id);

    expect(pageWithPermissions?.permissions.length).toBe(2);
    expect(pageWithPermissions?.permissions.find((p) => p.spaceId === spaceWithDefaultPagePermissionGroup.id)).toEqual(
      expect.objectContaining<Partial<PagePermission>>({
        inheritedFromPermission: null,
        spaceId: expect.stringContaining(spaceWithDefaultPagePermissionGroup.id),
        pageId: expect.stringContaining(page.id),
        permissionLevel: spaceWithDefaultPagePermissionGroup.defaultPagePermissionGroup as PagePermissionLevel
      })
    );
  });

  it('should assign full_access to a root page if the space has no default permission', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user2.id,
      spaceId: spaceWithoutDefaultPagePermissionGroup.id
    });

    const pageWithPermissions = await handlePageCreated(page.id);

    expect(pageWithPermissions?.permissions.length).toBe(2);
    expect(
      pageWithPermissions?.permissions.find((p) => p.spaceId === spaceWithoutDefaultPagePermissionGroup.id)
    ).toEqual(
      expect.objectContaining<Partial<PagePermission>>({
        inheritedFromPermission: null,
        spaceId: spaceWithoutDefaultPagePermissionGroup.id,
        pageId: page.id,
        permissionLevel: 'full_access'
      })
    );
  });

  it('should inherit all permissions from the parent', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: spaceWithDefaultPagePermissionGroup.id
    });

    const assignedPermissions = await Promise.all([
      upsertPagePermission({
        pageId: page.id,
        permission: {
          permissionLevel: 'full_access',
          assignee: {
            group: 'user',
            id: user1.id
          }
        }
      }),
      upsertPagePermission({
        pageId: page.id,
        permission: {
          permissionLevel: 'view',
          assignee: {
            group: 'space',
            id: spaceWithDefaultPagePermissionGroup.id
          }
        }
      })
    ]);

    const childPage = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: spaceWithDefaultPagePermissionGroup.id,
      parentId: page.id
    });

    const childWithPermissions = (await handlePageCreated(childPage.id)) as PageWithPermissions;

    expect(childWithPermissions?.permissions.length).toBe(assignedPermissions.length);

    const childInheritedUserPermission = childWithPermissions?.permissions.some(
      (permission) =>
        permission.permissionLevel === 'full_access' &&
        permission.userId === user1.id &&
        permission.pageId === childWithPermissions.id &&
        permission.inheritedFromPermission === assignedPermissions[0].id
    );

    const childInheritedSpacePermission = childWithPermissions?.permissions.some(
      (permission) =>
        permission.permissionLevel === 'view' &&
        permission.spaceId === spaceWithDefaultPagePermissionGroup.id &&
        permission.pageId === childWithPermissions.id &&
        permission.inheritedFromPermission === assignedPermissions[1].id
    );

    expect(childInheritedUserPermission).toBe(true);
    expect(childInheritedSpacePermission).toBe(true);
  });

  it('should insert a public:true page permission to a new root page if spaceDefaultPublic is true for that space', async () => {
    const { space: extraSpace, user: extraUser } = await testUtilsUser.generateUserAndSpace();

    await toggleSpaceDefaultPublicPage({
      spaceId: extraSpace.id,
      defaultPublicPages: true
    });

    const page = await testUtilsPages.generatePage({
      createdBy: extraUser.id,
      spaceId: extraSpace.id
    });

    const pageWithPermissions = await handlePageCreated(page.id);

    // Default space full access + creating user full access + public page permission
    expect(pageWithPermissions?.permissions.length).toBe(3);

    const publicPermission = pageWithPermissions.permissions.find((p) => p.public === true);

    expect(publicPermission).toBeDefined();
  });

  it('should not insert a public page permission to a new root page if spaceDefaultPublic is not true for that space', async () => {
    const { space: extraSpace, user: extraUser } = await testUtilsUser.generateUserAndSpace();

    await toggleSpaceDefaultPublicPage({
      spaceId: extraSpace.id,
      defaultPublicPages: false
    });

    const page = await testUtilsPages.generatePage({
      createdBy: extraUser.id,
      spaceId: extraSpace.id
    });

    const pageWithPermissions = await handlePageCreated(page.id);

    // Default space full access + creating user full access
    expect(pageWithPermissions?.permissions.length).toBe(2);

    const publicPermission = pageWithPermissions.permissions.find((p) => p.public === true);

    expect(publicPermission).not.toBeDefined();
  });

  // Here permissions inheritance should come into play
  it('should not insert a public page permission to a new child page if spaceDefaultPublic is true for that space', async () => {
    const { space: extraSpace, user: extraUser } = await testUtilsUser.generateUserAndSpace();

    await toggleSpaceDefaultPublicPage({
      spaceId: extraSpace.id,
      defaultPublicPages: true
    });

    let rootPage: Page | PageMetaWithPermissions = await testUtilsPages.generatePage({
      createdBy: extraUser.id,
      spaceId: extraSpace.id
    });

    rootPage = await handlePageCreated(rootPage.id);

    const publicPermissionId = rootPage.permissions.find((p) => p.public === true)?.id as string;

    await deletePagePermission({ permissionId: publicPermissionId });

    let childPage: Page | PageMetaWithPermissions = await testUtilsPages.generatePage({
      createdBy: extraUser.id,
      spaceId: extraSpace.id,
      parentId: rootPage.id
    });

    childPage = await handlePageCreated(childPage.id);

    // Default space full access + creating user full access
    expect(childPage.permissions.length).toBe(2);

    const publicPermission = childPage.permissions.find((p) => p.public === true);

    expect(publicPermission).not.toBeDefined();
  });

  it('should not add a permission for the space if the default space permission level is null', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        defaultPagePermissionGroup: null
      }
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const pageWithPermissions = await handlePageCreated(page.id);

    expect(pageWithPermissions.permissions.length).toBe(1);
    expect(pageWithPermissions.permissions[0].userId).toBe(user.id);
    expect(pageWithPermissions.permissions[0].spaceId).toBeNull();
  });

  it('should not create an individual page permission for a bot user', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        isBot: true
      }
    });

    await handlePageCreated(page.id);

    const pagePermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: page.id
      }
    });

    expect(pagePermissions.length).toBe(1);
    expect(pagePermissions[0].spaceId).toBe(space.id);
    expect(pagePermissions[0].userId).toBeNull();
  });
});
