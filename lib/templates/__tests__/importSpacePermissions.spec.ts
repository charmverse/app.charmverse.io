import { InvalidInputError } from '@charmverse/core/errors';
import type { ProposalCategory, Role, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { stringUtils } from '@charmverse/core/utilities';

import { exportSpaceData, type SpaceDataExport } from '../exportSpaceData';
import { importSpacePermissions } from '../importSpacePermissions';

describe('importSpacePermissions', () => {
  let sourceSpace: Space;
  let targetSpace: Space;

  let firstSourceProposalCategory: ProposalCategory;
  let secondSourceProposalCategory: ProposalCategory;
  let firstSourceRole: Role;
  let secondSourceRole: Role;
  let exportedData: SpaceDataExport;

  beforeAll(async () => {
    ({ space: sourceSpace } = await testUtilsUser.generateUserAndSpace());
    ({ space: targetSpace } = await testUtilsUser.generateUserAndSpace());

    firstSourceRole = await testUtilsMembers.generateRole({
      createdBy: sourceSpace.createdBy,
      spaceId: sourceSpace.id
    });

    secondSourceRole = await testUtilsMembers.generateRole({
      createdBy: sourceSpace.createdBy,
      spaceId: sourceSpace.id
    });

    firstSourceProposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: sourceSpace.id,
      title: 'Example created 1',
      proposalCategoryPermissions: [
        {
          assignee: { group: 'role', id: firstSourceRole.id },
          permissionLevel: 'full_access'
        },
        {
          assignee: { group: 'role', id: secondSourceRole.id },
          permissionLevel: 'view_comment'
        },
        {
          assignee: { group: 'space', id: sourceSpace.id },
          permissionLevel: 'view'
        }
      ]
    });
    secondSourceProposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: sourceSpace.id,
      title: 'Example created 2',
      proposalCategoryPermissions: [
        {
          assignee: { group: 'role', id: firstSourceRole.id },
          permissionLevel: 'full_access'
        },
        {
          assignee: { group: 'role', id: secondSourceRole.id },
          permissionLevel: 'view_comment'
        },
        {
          assignee: { group: 'space', id: sourceSpace.id },
          permissionLevel: 'view'
        }
      ]
    });

    exportedData = await exportSpaceData({ spaceId: sourceSpace.id });
  });

  it('should correctly import permissions using export data', async () => {
    const { roles: importedRoles, proposalCategoryPermissions: importedProposalCategoryPermissions } =
      await importSpacePermissions({
        targetSpaceIdOrDomain: targetSpace.id,
        exportData: exportedData
      });

    // Assuming importedPermissions structure reflects the permissions imported into targetSpace
    expect(importedProposalCategoryPermissions).toHaveLength(exportedData.roles?.length as number);
    expect(importedRoles).toHaveLength(2);
    expect(importedRoles).toEqual(
      expect.arrayContaining([
        {
          ...firstSourceRole,
          id: expect.not.stringContaining(firstSourceRole.id),
          spaceId: targetSpace.id
        },
        {
          ...secondSourceRole,
          id: expect.not.stringContaining(secondSourceRole.id),
          spaceId: targetSpace.id
        }
      ])
    );
  });

  it('should ensure idempotency when importing permissions', async () => {
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
    expect(reimportedPermissions).toMatchObject(importedPermissions);
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

  it('should fail for invalid permissions data', async () => {
    await expect(
      importSpacePermissions({
        targetSpaceIdOrDomain: targetSpace.id,
        exportData: { invalid: 'data' } as any // Invalid data for testing
      })
    ).rejects.toThrow(InvalidInputError);
  });
});
