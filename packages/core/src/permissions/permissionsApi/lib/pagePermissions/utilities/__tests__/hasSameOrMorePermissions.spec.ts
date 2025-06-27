/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PagePermission, Role, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import type { PageWithPermissions } from '@packages/core/pages';

import { upsertPagePermission } from '../../upsertPagePermission';
import { comparePermissionLevels, hasSameOrMorePermissions } from '../hasSameOrMorePermissions';
import { mapPagePermissionToAssignee } from '../mapPagePermissionToAssignee';

let user: User;
let space: Space;
let role: Role;

// Will return a nested tree of pages and associated permissions
// Creates as many pages as there are permission sets
async function setupPagesWithPermissions(permissionSets: Partial<PagePermission>[][]): Promise<PageWithPermissions[]> {
  let currentParentId: string | undefined;

  const pagesWithPermissions: PageWithPermissions[] = [];

  for (const set of permissionSets) {
    const newPage = await testUtilsPages.generatePage({
      parentId: currentParentId,
      createdBy: user.id,
      spaceId: space.id
    });

    currentParentId = newPage.id;

    await Promise.all(
      set.map((permission) => {
        return upsertPagePermission({
          pageId: newPage.id,
          permission: mapPagePermissionToAssignee({ permission: permission as any })
        });
      })
    );

    const withPermissions = await testUtilsPages.getPageWithPermissions(newPage.id);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pagesWithPermissions.push(withPermissions!);
  }

  return pagesWithPermissions;
}

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
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
      [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        },
        {
          spaceId: space.id,
          permissionLevel: 'view'
        }
      ],
      // Child page
      [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        },
        {
          spaceId: space.id,
          permissionLevel: 'view'
        }
      ]
    ]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const hasEqualOrMorePermissions = hasSameOrMorePermissions(root!.permissions, child!.permissions);

    expect(hasEqualOrMorePermissions).toBe(true);
  });

  it('should return true if the base permissions array is empty', async () => {
    const [page] = await setupPagesWithPermissions([
      [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    ]);

    const hasEqualOrMorePermissions = hasSameOrMorePermissions([], page.permissions);

    expect(hasEqualOrMorePermissions).toBe(true);
  });

  it('should return false when the compared list of permissions has less operations permitted than the base', async () => {
    const [root, child] = await setupPagesWithPermissions([
      // Root page
      [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        },
        {
          spaceId: space.id,
          permissionLevel: 'view'
        }
      ],
      // Child page
      [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    ]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const hasEqualOrMorePermissions = hasSameOrMorePermissions(root!.permissions, child!.permissions);

    expect(hasEqualOrMorePermissions).toBe(false);
  });
});

describe('comparePermissionLevels', () => {
  it('should return "more" if the comparison permission level provides more operations than the base permission level', () => {
    const comparison = comparePermissionLevels({ base: 'view', comparison: 'full_access' });
    expect(comparison).toBe('more');
  });

  it('should return "less" if the comparison permission level provides less operations than the base permission level', () => {
    const comparison = comparePermissionLevels({ base: 'full_access', comparison: 'view' });
    expect(comparison).toBe('less');
  });

  it('should return "equal" if the comparison permission level provides the same operations as the base permission level', () => {
    const comparison = comparePermissionLevels({ base: 'full_access', comparison: 'full_access' });
    expect(comparison).toBe('equal');
  });

  it('should return "different" if at least one set of operations does not fully intersect with the other', () => {
    const comparison = comparePermissionLevels({ base: 'view', comparison: ['edit_content'] });
    expect(comparison).toBe('different');
  });
});
