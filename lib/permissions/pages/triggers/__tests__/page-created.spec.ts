import type { PagePermission, PagePermissionLevel, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages/server';
import { PageNotFoundError } from 'lib/pages/server';
import { upsertPermission } from 'lib/permissions/pages/actions/upsert-permission';
import { ExpectedAnError } from 'testing/errors';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { deletePagePermission } from '../../actions';
import { toggleSpaceDefaultPublicPage } from '../../actions/toggleSpaceDefaultPublicPage';
import { setupPermissionsAfterPageCreated } from '../page-created';

let user1: User;
let spaceWithDefaultPagePermissionGroup: Space;
let user2: User;
let spaceWithoutDefaultPagePermissionGroup: Space;

beforeAll(async () => {
  const generated1 = await generateUserAndSpaceWithApiToken();
  user1 = generated1.user;
  spaceWithDefaultPagePermissionGroup = await prisma.space.update({
    where: {
      id: generated1.space.id
    },
    data: {
      defaultPagePermissionGroup: 'view_comment'
    }
  });

  const generated2 = await generateUserAndSpaceWithApiToken();
  user2 = generated2.user;
  spaceWithoutDefaultPagePermissionGroup = generated2.space;
});

describe('setupPermissionsAfterPageCreated', () => {
  it('should fail if the page doesn\'t exist', async () => {
    try {
      await setupPermissionsAfterPageCreated(v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(PageNotFoundError);
    }
  });

  it('should assign full access to the user creating the page', async () => {
    const page = await createPage({
      createdBy: user1.id,
      spaceId: spaceWithDefaultPagePermissionGroup.id
    });

    const pageWithPermissions = await setupPermissionsAfterPageCreated(page.id);

    expect(pageWithPermissions.permissions.some(p => p.userId === user1.id && p.permissionLevel === 'full_access'));
  });

  it('should assign the space default page permission to a root page', async () => {

    const page = await createPage({
      createdBy: user1.id,
      spaceId: spaceWithDefaultPagePermissionGroup.id
    });

    const pageWithPermissions = await setupPermissionsAfterPageCreated(page.id);

    expect(pageWithPermissions?.permissions.length).toBe(2);
    expect(pageWithPermissions?.permissions.find(p => p.spaceId === spaceWithDefaultPagePermissionGroup.id)).toEqual(
      expect.objectContaining<Partial<PagePermission>>({
        inheritedFromPermission: null,
        spaceId: expect.stringContaining(spaceWithDefaultPagePermissionGroup.id),
        pageId: expect.stringContaining(page.id),
        permissionLevel: spaceWithDefaultPagePermissionGroup.defaultPagePermissionGroup as PagePermissionLevel
      })
    );
  });

  it('should assign full_access to a root page if the space has no default permission', async () => {

    const page = await createPage({
      createdBy: user2.id,
      spaceId: spaceWithoutDefaultPagePermissionGroup.id
    });

    const pageWithPermissions = await setupPermissionsAfterPageCreated(page.id);

    expect(pageWithPermissions?.permissions.length).toBe(2);
    expect(pageWithPermissions?.permissions.find(p => p.spaceId === spaceWithoutDefaultPagePermissionGroup.id)).toEqual(
      expect.objectContaining<Partial<PagePermission>>({
        inheritedFromPermission: null,
        spaceId: spaceWithoutDefaultPagePermissionGroup.id,
        pageId: page.id,
        permissionLevel: 'full_access'
      })
    );
  });

  it('should inherit all permissions from the parent', async () => {
    const page = await createPage({
      createdBy: user1.id,
      spaceId: spaceWithDefaultPagePermissionGroup.id
    });

    const assignedPermissions = await Promise.all([
      upsertPermission(page.id, {
        permissionLevel: 'full_access',
        userId: user1.id
      }),
      upsertPermission(page.id, {
        permissionLevel: 'view',
        spaceId: spaceWithDefaultPagePermissionGroup.id
      })
    ]);

    const childPage = await createPage({
      createdBy: user1.id,
      spaceId: spaceWithDefaultPagePermissionGroup.id,
      parentId: page.id
    });

    const childWithPermissions = await setupPermissionsAfterPageCreated(childPage.id) as IPageWithPermissions;

    expect(childWithPermissions?.permissions.length).toBe(assignedPermissions.length);

    const childInheritedUserPermission = childWithPermissions?.permissions.some(permission => permission.permissionLevel === 'full_access' && permission.userId === user1.id && permission.pageId === childWithPermissions.id && permission.inheritedFromPermission === assignedPermissions[0].id);

    const childInheritedSpacePermission = childWithPermissions?.permissions.some(permission => permission.permissionLevel === 'view' && permission.spaceId === spaceWithDefaultPagePermissionGroup.id && permission.pageId === childWithPermissions.id && permission.inheritedFromPermission === assignedPermissions[1].id);

    expect(childInheritedUserPermission).toBe(true);
    expect(childInheritedSpacePermission).toBe(true);
  });

  it('should insert a public:true page permission to a new root page if spaceDefaultPublic is true for that space', async () => {

    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await toggleSpaceDefaultPublicPage({
      spaceId: extraSpace.id,
      defaultPublicPages: true
    });

    const page = await createPage({
      createdBy: extraUser.id,
      spaceId: extraSpace.id
    });

    const pageWithPermissions = await setupPermissionsAfterPageCreated(page.id);

    // Default space full access + creating user full access + public page permission
    expect(pageWithPermissions?.permissions.length).toBe(3);

    const publicPermission = pageWithPermissions.permissions.find(p => p.public === true);

    expect(publicPermission).toBeDefined();
  });

  it('should not insert a public page permission to a new root page if spaceDefaultPublic is not true for that space', async () => {

    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await toggleSpaceDefaultPublicPage({
      spaceId: extraSpace.id,
      defaultPublicPages: false
    });

    const page = await createPage({
      createdBy: extraUser.id,
      spaceId: extraSpace.id
    });

    const pageWithPermissions = await setupPermissionsAfterPageCreated(page.id);

    // Default space full access + creating user full access
    expect(pageWithPermissions?.permissions.length).toBe(2);

    const publicPermission = pageWithPermissions.permissions.find(p => p.public === true);

    expect(publicPermission).not.toBeDefined();
  });

  // Here permissions inheritance should come into play
  it('should not insert a public page permission to a new child page if spaceDefaultPublic is true for that space', async () => {

    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await toggleSpaceDefaultPublicPage({
      spaceId: extraSpace.id,
      defaultPublicPages: true
    });

    let rootPage = await createPage({
      createdBy: extraUser.id,
      spaceId: extraSpace.id
    });

    rootPage = await setupPermissionsAfterPageCreated(rootPage.id);

    const publicPermissionId = rootPage.permissions.find(p => p.public === true)?.id as string;

    await deletePagePermission(publicPermissionId);

    let childPage = await createPage({
      createdBy: extraUser.id,
      spaceId: extraSpace.id,
      parentId: rootPage.id
    });

    childPage = await setupPermissionsAfterPageCreated(childPage.id);

    // Default space full access + creating user full access
    expect(childPage.permissions.length).toBe(2);

    const publicPermission = childPage.permissions.find(p => p.public === true);

    expect(publicPermission).not.toBeDefined();
  });

});
