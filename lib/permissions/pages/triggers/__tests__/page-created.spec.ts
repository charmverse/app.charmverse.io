import { PagePermission, Space, User } from '@prisma/client';
import { createPagePermission } from 'lib/permissions/pages/page-permission-actions';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { PagePermissionLevelType } from '../../page-permission-interfaces';
import { setupPermissionsAfterPageCreated } from '../page-created';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();

  user = generated.user;
  space = generated.space;
});

describe('setupPermissionsAfterPageCreated', () => {
  it('should assign a default space/full access for the page if it has no parents', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const pageWithPermissions = await setupPermissionsAfterPageCreated(page.id);

    expect(pageWithPermissions?.permissions.length).toBe(1);

    expect(pageWithPermissions?.permissions[0]).toEqual(
      expect.objectContaining<Partial<PagePermission>>({
        inheritedFromPermission: null,
        spaceId: expect.stringContaining(space.id),
        pageId: expect.stringContaining(page.id),
        permissionLevel: expect.stringContaining(<PagePermissionLevelType>'full_access')
      })
    );
  });

  it('should return the page with its new permissions', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const assignedPermissions = await Promise.all([
      createPagePermission({
        pageId: page.id,
        permissionLevel: 'full_access',
        userId: user.id
      }),
      createPagePermission({
        pageId: page.id,
        permissionLevel: 'view',
        spaceId: space.id
      })
    ]);

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: page.id
    });

    const childWithPermissions = await setupPermissionsAfterPageCreated(childPage.id);

    expect(childWithPermissions?.permissions.length).toBe(assignedPermissions.length);
    expect(childWithPermissions?.permissions.some(permission => permission.permissionLevel === 'full_access' && permission.userId === user.id && permission.pageId === childWithPermissions.id && permission.inheritedFromPermission === assignedPermissions[0].id));
    expect(childWithPermissions?.permissions.some(permission => permission.permissionLevel === 'view' && permission.spaceId === user.id && permission.pageId === childWithPermissions.id && permission.inheritedFromPermission === assignedPermissions[0].id));

  });

});
