/* eslint-disable @typescript-eslint/no-unused-vars */
import { PagePermission, Role, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { getPage, IPageWithPermissions } from 'lib/pages/server';
import { hasSameOrMorePermissions } from '../has-same-or-more-permissions';
import { upsertPermission } from '../upsert-permission';

let user: User;
let space: Space;
let role: Role;

// Will return a nested tree of pages and associated permissions
// Creates as many pages as there are permission sets
async function setupPagesWithPermissions (permissionSets: Array<Partial<PagePermission>[]>): Promise<IPageWithPermissions []> {

  let currentParentId: string | undefined;

  const pagesWithPermissions: IPageWithPermissions [] = [];

  for (const set of permissionSets) {
    const newPage = await createPage({
      parentId: currentParentId,
      createdBy: user.id,
      spaceId: space.id
    });

    currentParentId = newPage.id;

    await Promise.all(
      set.map(permission => {
        return upsertPermission(newPage.id, permission as any);
      })
    );

    const withPermissions = await getPage(newPage.id);
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

describe('hasSameOrMorePermissions', () => {

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
    const hasEqualOrMorePermissions = hasSameOrMorePermissions(root!.permissions, child!.permissions);

    expect(hasEqualOrMorePermissions).toBe(true);

  });

  it('should return true if the base permissions array is empty', async () => {

    const [page] = await setupPagesWithPermissions([
      [{
        userId: user.id,
        permissionLevel: 'full_access'
      }]
    ]);

    const hasEqualOrMorePermissions = hasSameOrMorePermissions([], page.permissions);

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
    const hasEqualOrMorePermissions = hasSameOrMorePermissions(root!.permissions, child!.permissions);

    expect(hasEqualOrMorePermissions).toBe(false);
  });
});
