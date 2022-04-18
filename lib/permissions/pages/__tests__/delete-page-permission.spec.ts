
import { Space, User } from '@prisma/client';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { ExpectedAnError } from 'testing/errors';
import { createPagePermission, deletePagePermission } from '../page-permission-actions';
import { InvalidPermissionGranteeError, PermissionNotFoundError } from '../errors';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('deletePagePermission', () => {

  it('should delete only the target permission for that page', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const rootPermissions = await Promise.all([
      createPagePermission(
        {
          pageId: page.id,
          permissionLevel: 'full_access',
          userId: user.id
        }
      ),
      createPagePermission({
        pageId: page.id,
        permissionLevel: 'view',
        spaceId: space.id
      })
    ]);

    await deletePagePermission(rootPermissions[0].id);

    const remainingPermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: page.id
      }
    });

    expect(remainingPermissions.length).toBe(1);

  });

  it('should delete any permissions on other pages inherited from it', async () => {
    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const rootPermissions = await Promise.all([
      createPagePermission(
        {
          pageId: root.id,
          permissionLevel: 'full_access',
          userId: user.id
        }
      ),
      createPagePermission({
        pageId: root.id,
        permissionLevel: 'view',
        spaceId: space.id
      })
    ]);

    const childPermissions = await Promise.all([
      createPagePermission(
        {
          pageId: child.id,
          permissionLevel: 'full_access',
          userId: user.id,
          inheritedFromPermission: rootPermissions[0].id
        }
      ),
      createPagePermission({
        pageId: child.id,
        permissionLevel: 'view',
        spaceId: space.id,
        inheritedFromPermission: rootPermissions[1].id
      })
    ]);

    await deletePagePermission(rootPermissions[0].id);

    const remainingChildPermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: child.id
      }
    });

    expect(remainingChildPermissions.length).toBe(1);

  });

  it('should throw an error if no permission exists', async () => {
    try {
      await deletePagePermission(v4());
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(PermissionNotFoundError);
    }
  });

});
