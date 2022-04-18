import { Page, PagePermission, Role, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createPagePermission } from '../page-permission-actions';
import { IPageWithPermissions } from '../page-permission-interfaces';
import { canInheritPermissionsFromParent, hasFullSetOfBasePermissions } from '../refresh-page-permission-tree';

let user: User;
let space: Space;
let role: Role;

function createPage (options: Partial<Pick<Page, 'parentId'>> = {}): Promise<Page> {
  return prisma.page.create({
    data: {
      contentText: '',
      path: v4(),
      title: 'Example',
      type: 'page',
      updatedBy: user.id,
      author: {
        connect: {
          id: user.id
        }
      },
      space: {
        connect: {
          id: space.id
        }
      },
      parentId: options.parentId
    }
  });
}

// Will return a nested tree of pages and associated permissions
// Creates as many pages as there are permission sets
async function setupPagesWithPermissions (permissionSets: Array<Partial<PagePermission>[]>): Promise<IPageWithPermissions []> {

  let currentParentId: string | undefined;

  const pagesWithPermissions: IPageWithPermissions [] = [];

  for (const set of permissionSets) {
    const newPage = await createPage({
      parentId: currentParentId
    });

    currentParentId = newPage.id;

    await Promise.all(
      set.map(permission => {
        permission.pageId = newPage.id;
        return createPagePermission(permission as any);
      })
    );

    const withPermissions = await prisma.page.findUnique({
      where: {
        id: newPage.id
      },
      include: {
        permissions: true
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pagesWithPermissions.push(withPermissions!);
  }

  return pagesWithPermissions;
}

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;

  const createdRole = await prisma.role.create({
    data: {
      createdBy: user.id,
      name: 'Manager',
      space: {
        connect: {
          id: space.id
        }
      }
    }
  });

  role = createdRole;

});

describe('hasFullSetOfBasePermissions', () => {

  it('should return true when the compared list of permissions allows the same set of operations than the base', async () => {

    const [root, child] = await setupPagesWithPermissions([
      // Root page
      [{
        userId: user.id,
        permissionLevel: 'full_access'
      },
      {
        spaceId: space.id,
        permissionLevel: 'view'
      }],
      // Child page
      [{
        userId: user.id,
        permissionLevel: 'full_access'
      },
      {
        spaceId: space.id,
        permissionLevel: 'view'
      }]
    ]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const hasEqualOrMorePermissions = hasFullSetOfBasePermissions(root!.permissions, child!.permissions);

    expect(hasEqualOrMorePermissions).toBe(true);

  });

  it('should return false when the compared list of permissions has less operations permitted than the base', async () => {

    const [root, child] = await setupPagesWithPermissions([
      // Root page
      [{
        userId: user.id,
        permissionLevel: 'full_access'
      },
      {
        spaceId: space.id,
        permissionLevel: 'view'
      }],
      // Child page
      [{
        userId: user.id,
        permissionLevel: 'full_access'
      }]
    ]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const hasEqualOrMorePermissions = hasFullSetOfBasePermissions(root!.permissions, child!.permissions);

    expect(hasEqualOrMorePermissions).toBe(false);
  });
});

describe('canInheritFromParent', () => {

  it('should return false when the page does not have a parent', async () => {
    const rootPage = await createPage();

    const canInherit = await canInheritPermissionsFromParent(rootPage.id);

    expect(canInherit).toBe(false);

  });
  it('should return true when the child page has the same amount of permissions as the parent', async () => {

    const [root, child] = await setupPagesWithPermissions([
      // Root page
      [{
        userId: user.id,
        permissionLevel: 'full_access'
      },
      {
        spaceId: space.id,
        permissionLevel: 'view'
      }],
      // Child page
      [{
        userId: user.id,
        permissionLevel: 'full_access'
      },
      {
        spaceId: space.id,
        permissionLevel: 'view'
      }]
    ]);

    const canInherit = await canInheritPermissionsFromParent(child.id);

    expect(canInherit).toBe(true);

  });

  it('should return false when the child page has less permissions than the parent', async () => {

    const [root, child] = await setupPagesWithPermissions([
      // Root page
      [{
        userId: user.id,
        permissionLevel: 'full_access'
      },
      {
        spaceId: space.id,
        permissionLevel: 'view'
      }],
      // Child page
      [
        {
          spaceId: space.id,
          permissionLevel: 'view'
        }]
    ]);

    const canInherit = await canInheritPermissionsFromParent(child.id);

    expect(canInherit).toBe(false);

  });

});
