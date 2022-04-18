
import { Space, User } from '@prisma/client';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { ExpectedAnError } from 'testing/errors';
import { createPagePermission } from '../page-permission-actions';
import { InvalidPermissionGranteeError } from '../errors';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('createPagePermission', () => {

  it('should create a permission for a page', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const createdPermission = await createPagePermission({
      pageId: page.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    expect(createdPermission).toBeDefined();
  });

  it('should overwrite an existing permission for a page', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await createPagePermission({
      pageId: page.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    const updatedPermission = await createPagePermission({
      pageId: page.id,
      permissionLevel: 'view',
      userId: user.id
    });

    const pagePermissionsForUser = await prisma.pagePermission.findMany({
      where: {
        pageId: page.id,
        userId: user.id
      }
    });

    expect(updatedPermission.permissionLevel).toBe('view');
    expect(pagePermissionsForUser.length).toBe(1);
  });

  it('should throw an error if more than one group is linked to the permission', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    try {

      await createPagePermission({
        pageId: page.id,
        permissionLevel: 'full_access',
        userId: user.id,
        spaceId: space.id
      });

      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(InvalidPermissionGranteeError);
    }
  });

  it('should specify which page the permission was inherited from when created', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const created = await createPagePermission({
      pageId: child.id,
      permissionLevel: 'full_access',
      userId: user.id,
      inheritedFromPage: parent.id
    });

    expect(created.inheritedFromPage).toBe(parent.id);

  });

  it('should delete the reference to the page the permission was inherited from if not provided in upsert mode', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const created = await createPagePermission({
      pageId: child.id,
      permissionLevel: 'full_access',
      userId: user.id,
      inheritedFromPage: parent.id
    });

    const updated = await createPagePermission({
      pageId: child.id,
      permissionLevel: 'view',
      userId: user.id
    });

    expect(updated.inheritedFromPage).toBeNull();

  });

});
