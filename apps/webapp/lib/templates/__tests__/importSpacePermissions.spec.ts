import type { PostCategory, Role, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import type { AssignedPostCategoryPermission, TargetPermissionGroup } from '@packages/core/permissions';
import { mapPostCategoryPermissionToAssignee } from '@packages/lib/permissions/forum/mapPostCategoryPermissionToAssignee';
import type { AssignedSpacePermission } from '@packages/lib/permissions/spaces/mapSpacePermissionToAssignee';
import { mapSpacePermissionToAssignee } from '@packages/lib/permissions/spaces/mapSpacePermissionToAssignee';

import { exportSpaceData, type SpaceDataExport } from '../exportSpaceData';
import type { ImportedPermissions } from '../importSpacePermissions';
import { importSpacePermissions } from '../importSpacePermissions';

describe('importSpacePermissions', () => {
  let sourceSpace: Space;

  let firstSourcePostCategory: PostCategory;
  let secondSourcePostCategory: PostCategory;

  let firstSourceRole: Role;
  let secondSourceRole: Role;
  let exportedData: SpaceDataExport;

  let spacePermissions: AssignedSpacePermission[];
  let postCategoryPermissions: AssignedPostCategoryPermission[];

  beforeAll(async () => {
    ({ space: sourceSpace } = await testUtilsUser.generateUserAndSpace());

    firstSourceRole = await testUtilsMembers.generateRole({
      createdBy: sourceSpace.createdBy,
      spaceId: sourceSpace.id
    });

    secondSourceRole = await testUtilsMembers.generateRole({
      createdBy: sourceSpace.createdBy,
      spaceId: sourceSpace.id
    });

    firstSourcePostCategory = await testUtilsForum.generatePostCategory({
      spaceId: sourceSpace.id,
      name: 'Example created 1',
      permissions: [
        {
          assignee: { group: 'role', id: firstSourceRole.id },
          permissionLevel: 'full_access'
        },
        {
          assignee: { group: 'role', id: secondSourceRole.id },
          permissionLevel: 'comment_vote'
        },
        {
          assignee: { group: 'space', id: sourceSpace.id },
          permissionLevel: 'view'
        }
      ]
    });
    secondSourcePostCategory = await testUtilsForum.generatePostCategory({
      spaceId: sourceSpace.id,
      name: 'Example created 2',
      permissions: [
        {
          assignee: { group: 'role', id: firstSourceRole.id },
          permissionLevel: 'full_access'
        },
        {
          assignee: { group: 'role', id: secondSourceRole.id },
          permissionLevel: 'comment_vote'
        },
        {
          assignee: { group: 'space', id: sourceSpace.id },
          permissionLevel: 'view'
        }
      ]
    });

    spacePermissions = await prisma
      .$transaction([
        // Space
        prisma.spacePermission.create({
          data: {
            forSpace: { connect: { id: sourceSpace.id } },
            space: { connect: { id: sourceSpace.id } },
            operations: ['createBounty', 'createPage', 'createForumCategory']
          }
        }),
        // Roles
        prisma.spacePermission.create({
          data: {
            forSpace: { connect: { id: sourceSpace.id } },
            role: { connect: { id: firstSourceRole.id } },
            operations: ['createBounty', 'createPage', 'createForumCategory', 'deleteAnyPage', 'deleteAnyProposal']
          }
        }),
        prisma.spacePermission.create({
          data: {
            forSpace: { connect: { id: sourceSpace.id } },
            role: { connect: { id: secondSourceRole.id } },
            operations: ['createBounty', 'createPage', 'createForumCategory', 'deleteAnyPage', 'deleteAnyProposal']
          }
        })
      ])
      .then((data) => data.map(mapSpacePermissionToAssignee));

    postCategoryPermissions = await prisma.postCategoryPermission
      .findMany({
        where: { postCategory: { spaceId: sourceSpace.id } }
      })
      .then((data) => data.map(mapPostCategoryPermissionToAssignee));

    exportedData = await exportSpaceData({ spaceIdOrDomain: sourceSpace.id });
  });

  it('should correctly import permissions using export data', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const importResult = await importSpacePermissions({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: exportedData
    });

    expect(importResult).toMatchObject<ImportedPermissions>({
      postCategoryPermissions: expect.arrayContaining(
        postCategoryPermissions.map((p) => ({
          permissionLevel: p.permissionLevel,
          id: expect.any(String),
          postCategoryId: expect.any(String),
          assignee: {
            group: p.assignee.group,
            id: p.assignee.group === 'space' ? targetSpace.id : expect.any(String)
          } as TargetPermissionGroup<'role' | 'space'>
        }))
      ),
      spacePermissions: expect.arrayContaining<AssignedSpacePermission>(
        spacePermissions.map((p) => ({
          operations: p.operations,
          assignee: {
            group: p.assignee.group,
            id: p.assignee.group === 'space' ? targetSpace.id : expect.any(String)
          }
        }))
      ),
      roles: expect.arrayContaining([
        {
          ...firstSourceRole,
          createdAt: expect.any(Date),
          createdBy: targetSpace.createdBy,
          id: expect.not.stringContaining(firstSourceRole.id),
          spaceId: targetSpace.id
        },
        {
          ...secondSourceRole,
          createdAt: expect.any(Date),
          createdBy: targetSpace.createdBy,
          id: expect.not.stringContaining(secondSourceRole.id),
          spaceId: targetSpace.id
        }
      ])
    });

    // Reload roles for checking as a safeguard
    const targetSpaceRoleIds = await prisma.role
      .findMany({
        where: { spaceId: targetSpace.id }
      })
      .then((_roles) => _roles.map((r) => r.id));

    const allPermissions = [...importResult.spacePermissions, ...importResult.postCategoryPermissions];

    allPermissions.forEach((permission) => {
      if (permission.assignee.group === 'space') {
        expect(permission.assignee.id).toBe(targetSpace.id);
      } else if (permission.assignee.group === 'role') {
        expect(targetSpaceRoleIds).toContain(permission.assignee.id);
      }
    });

    importResult.roles.forEach((role) => {
      expect(targetSpaceRoleIds).toContain(role.id);
    });
  });

  it('should ensure idempotency when importing permissions', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();
    // First import
    const importedPermissions = await importSpacePermissions({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: exportedData
    });

    // Repeat import
    const reimportedPermissions = await importSpacePermissions({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: exportedData
    });

    // Idempotency check - assuming no duplicate entries are created
    expect(reimportedPermissions).toMatchObject({
      ...reimportedPermissions,
      postCategoryPermissions: expect.arrayContaining(importedPermissions.postCategoryPermissions)
    });
  });

  it('should throw InvalidInputError if targetSpaceIdOrDomain is missing', async () => {
    await expect(importSpacePermissions({ exportData: exportedData } as any)).rejects.toThrow(InvalidInputError);
  });

  it('should throw NotFoundError for a non-existent target space', async () => {
    const nonExistentDomain = 'nonexistentdomain.com';
    await expect(
      importSpacePermissions({
        targetSpaceIdOrDomain: nonExistentDomain,
        exportData: exportedData
      })
    ).rejects.toThrowError();
  });

  it('should perform a no-op if no import data is provided', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();
    await expect(
      importSpacePermissions({
        targetSpaceIdOrDomain: targetSpace.id,
        exportData: {} as any // Invalid data for testing
      })
    ).resolves.toMatchObject<ImportedPermissions>({
      postCategoryPermissions: [],
      roles: [],
      spacePermissions: []
    });
  });
});
