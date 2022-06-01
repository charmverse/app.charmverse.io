import { Space, User } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';
import { SpaceNotFoundError } from 'lib/public-api';
import { ExpectedAnError } from 'testing/errors';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { setSpaceDefaultPagePermission } from '../setSpaceDefaultPagePermission';

let space: Space;
let page: IPageWithPermissions;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generated.space;
  user = generated.user;
  const tempPage = await createPage({
    spaceId: space.id,
    createdBy: user.id
  });
  page = await prisma.page.update({
    where: {
      id: tempPage.id
    },
    data: {
      permissions: {
        create: {
          permissionLevel: 'full_access',
          spaceId: space.id
        }
      }
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });
});

describe('setSpaceDefaultPagePermission', () => {
  it('should throw error if no space is found with the id', async () => {
    try {
      await setSpaceDefaultPagePermission(v4(), 'editor');
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(SpaceNotFoundError);
    }
  });

  it('Should return space with permissions after the default page permission has been set', async () => {
    const spaceWithPermission = await setSpaceDefaultPagePermission(space.id, 'view');
    expect(spaceWithPermission.defaultPagePermissionGroup).toBe('view');
    expect(page.permissions[0]).toMatchObject(expect.objectContaining({
      permissionLevel: 'full_access'
    }));
  });
});
