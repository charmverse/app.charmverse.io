import { InvalidInputError } from '@charmverse/core/errors';
import {
  mapProposalCategoryPermissionToAssignee,
  type AssignedProposalCategoryPermission,
  type TargetPermissionGroup
} from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { Prisma, Role, SpaceOperation } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import {
  mapSpacePermissionToAssignee,
  type AssignedSpacePermission
} from 'lib/permissions/spaces/mapSpacePermissionToAssignee';
import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import { importProposalCategories } from './importProposalCategories';
import { importRoles } from './importRoles';
import type { ImportParams } from './interfaces';

export type ImportedPermissions = {
  spacePermissions: AssignedSpacePermission[];
  proposalCategoryPermissions: AssignedProposalCategoryPermission[];
  roles: Role[];
};

export async function importSpacePermissions({
  targetSpaceIdOrDomain,
  ...params
}: ImportParams): Promise<ImportedPermissions> {
  const targetSpace = await getSpace(targetSpaceIdOrDomain);

  const { permissions, roles, proposalCategories } = await getImportData(params);

  const sourceProposalCategoryPermissions = permissions?.proposalCategoryPermissions ?? [];
  const sourceSpacePermissions = permissions?.spacePermissions ?? [];

  // Port over roles
  const { oldNewRecordIdHashMap: roleIdsHashMap, roles: importedRolesFromTemplate } = await importRoles({
    targetSpaceIdOrDomain,
    ...params
  });

  const { oldNewIdMap: sourceTargetProposalCategoryHashmap, proposalCategories: importedProposalCategories } =
    await importProposalCategories({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: {
        proposalCategories:
          proposalCategories ||
          (await prisma.proposalCategory.findMany({
            where: {
              id: {
                in: sourceProposalCategoryPermissions.map((p) => p.proposalCategoryId)
              }
            }
          }))
      }
    });

  // Match categories by title
  const proposalCategoryPermissionsToCreate: Prisma.ProposalCategoryPermissionCreateManyInput[] =
    sourceProposalCategoryPermissions
      .map(({ assignee, proposalCategoryId, permissionLevel }) => {
        const assigneeId = (assignee as TargetPermissionGroup<'role' | 'space'>).id;
        const isRolePermission = assignee.group === 'role';
        const isSpacePermission = assignee.group === 'space';
        const matchingCategoryId = sourceTargetProposalCategoryHashmap[proposalCategoryId];

        if ((!isRolePermission && !isSpacePermission) || !matchingCategoryId) {
          return null;
        }

        return {
          id: uuid(),
          spaceId: isSpacePermission ? targetSpace.id : undefined,
          roleId: isRolePermission ? roleIdsHashMap[assigneeId] : undefined,
          proposalCategoryId: matchingCategoryId,
          permissionLevel
        } as Prisma.ProposalCategoryPermissionCreateManyInput;
      })
      .filter((val) => !!val) as Prisma.ProposalCategoryPermissionCreateManyInput[];

  // Lock in changes inside the db
  await prisma.proposalCategoryPermission.createMany({ data: proposalCategoryPermissionsToCreate });

  const createdProposalCategoryPermissions = await prisma.proposalCategoryPermission
    .findMany({
      where: {
        id: {
          in: proposalCategoryPermissionsToCreate.map((p) => p.id as string)
        }
      }
    })
    .then((_permissions) => _permissions.map(mapProposalCategoryPermissionToAssignee));

  ///

  const spacePermissionsToCreate: Prisma.SpacePermissionCreateManyInput[] = sourceSpacePermissions
    .map(({ assignee, operations }) => {
      const assigneeId = (assignee as TargetPermissionGroup<'role' | 'space'>).id;
      const isRolePermission = assignee.group === 'role';
      const isSpacePermission = assignee.group === 'space';

      if (!isRolePermission && !isSpacePermission) {
        return null;
      }

      return {
        id: uuid(),
        forSpaceId: targetSpace.id,
        spaceId: isSpacePermission ? targetSpace.id : undefined,
        roleId: isRolePermission ? roleIdsHashMap[assigneeId] : undefined,
        operations: Object.entries(operations)
          .filter(([key, value]) => !!value)
          .map(([key]) => key as SpaceOperation)
      } as Prisma.SpacePermissionCreateManyInput;
    })
    .filter((val) => !!val) as Prisma.SpacePermissionCreateManyInput[];

  // Lock in changes inside the db for space permissions
  await prisma.spacePermission.createMany({ data: spacePermissionsToCreate });

  const createdSpacePermissions = await prisma.spacePermission
    .findMany({
      where: {
        id: {
          in: spacePermissionsToCreate.map((p) => p.id as string)
        }
      }
    })
    .then((_permissions) => _permissions.map(mapSpacePermissionToAssignee));

  return {
    proposalCategoryPermissions: createdProposalCategoryPermissions,
    roles: importedRolesFromTemplate,
    spacePermissions: createdSpacePermissions
  };
}
