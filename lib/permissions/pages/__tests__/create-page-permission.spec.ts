
import { Space, User } from '@prisma/client';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { ExpectedAnError } from 'testing/errors';
import { createPagePermission } from '../page-permission-actions';
import { CircularPermissionError, InvalidPermissionGranteeError, SelfInheritancePermissionError } from '../errors';

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

  it('should throw an error if an attempt inherit a permission from itself happens', async () => {
    const parentPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPagePermission = await createPagePermission({
      pageId: parentPage.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    try {
      await createPagePermission({
        pageId: parentPage.id,
        permissionLevel: 'full_access',
        userId: user.id,
        inheritedFromPermission: parentPagePermission.id
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(SelfInheritancePermissionError);
    }
  });

  it('should throw an error if an attempt to create circular inheritance between two permissions happens', async () => {
    const parentPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const parentPagePermission = await createPagePermission({
      pageId: parentPage.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    const childPagePermission = await createPagePermission({
      pageId: childPage.id,
      permissionLevel: 'full_access',
      userId: user.id,
      inheritedFromPermission: parentPagePermission.id
    });

    try {
      console.log('Executing function');
      await createPagePermission({
        pageId: parentPage.id,
        permissionLevel: 'full_access',
        userId: user.id,
        inheritedFromPermission: childPagePermission.id
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      console.log('Received an error', error);
      expect(error).toBeInstanceOf(CircularPermissionError);
    }

  });

  it('should specify which permission the permission was inherited from when created', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await createPagePermission({
      pageId: parent.id,
      permissionLevel: 'full_access',
      userId: user.id
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
      inheritedFromPermission: parentPermission.id
    });

    expect(created.sourcePermission?.id).toBe(parentPermission.id);

  });

  it('should delete the reference to the page the permission was inherited from if not provided in upsert mode', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await createPagePermission({
      pageId: parent.id,
      permissionLevel: 'full_access',
      userId: user.id
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
      inheritedFromPermission: parentPermission.id

    });

    const updated = await createPagePermission({
      pageId: child.id,
      permissionLevel: 'view',
      userId: user.id
    });

    expect(updated.inheritedFromPermission).toBeNull();

  });

  it('should update the permissions that inherit from an existing permission when updated', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await createPagePermission({
      pageId: parent.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const createdChild = await createPagePermission({
      pageId: child.id,
      permissionLevel: 'full_access',
      userId: user.id,
      inheritedFromPermission: parentPermission.id

    });

    const updatedParent = await createPagePermission({
      pageId: parent.id,
      permissionLevel: 'view',
      userId: user.id
    });

    const updatedChild = await prisma.pagePermission.findUnique({
      where: {
        id: createdChild.id
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updatedChild!.permissionLevel).toBe(updatedParent.permissionLevel);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updatedChild!.inheritedFromPermission).toBe(updatedParent.id);

  });

});
