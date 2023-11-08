import { mapProposalCategoryPermissionToAssignee } from '@charmverse/core/permissions';
import type {
  AssignedPostCategoryPermission,
  AssignedProposalCategoryPermission,
  TargetPermissionGroup
} from '@charmverse/core/permissions';
import type { Prisma, Role, SpaceOperation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { mapPostCategoryPermissionToAssignee } from 'lib/permissions/forum/mapPostCategoryPermissionToAssignee';
import {
  mapSpacePermissionToAssignee,
  type AssignedSpacePermission
} from 'lib/permissions/spaces/mapSpacePermissionToAssignee';
import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import { importPostCategories } from './importPostCategories';
import { importProposalCategories } from './importProposalCategories';
import { importRoles } from './importRoles';
import type { ImportParams } from './interfaces';

export type ImportedPermissions = {
  spacePermissions: AssignedSpacePermission[];
  proposalCategoryPermissions: AssignedProposalCategoryPermission<'role' | 'space'>[];
  postCategoryPermissions: AssignedPostCategoryPermission<'role' | 'space'>[];
  roles: Role[];
};

export async function importSpacePermissions({
  targetSpaceIdOrDomain,
  ...params
}: ImportParams): Promise<ImportedPermissions> {
  const targetSpace = await getSpace(targetSpaceIdOrDomain);

  const { permissions, proposalCategories, postCategories } = await getImportData(params);

  const sourceProposalCategoryPermissions = permissions?.proposalCategoryPermissions ?? [];
  const sourcePostCategoryPermissions = permissions?.postCategoryPermissions ?? [];
  const sourceSpacePermissions = permissions?.spacePermissions ?? [];

  const [
    existingTargetSpacePermissions,
    existingTargetSpacePostCategoryPermissions,
    existingTargetSpaceProposalCategoryPermissions
  ] = await Promise.all([
    prisma.spacePermission.findMany({
      where: {
        forSpaceId: targetSpace.id
      }
    }),
    prisma.postCategoryPermission.findMany({
      where: {
        postCategory: {
          spaceId: targetSpace.id
        }
      }
    }),
    prisma.proposalCategoryPermission.findMany({
      where: {
        proposalCategory: {
          spaceId: targetSpace.id
        }
      }
    })
  ]);

  // Port over roles
  const { oldNewRecordIdHashMap: roleIdsHashMap, roles: importedRolesFromTemplate } = await importRoles({
    targetSpaceIdOrDomain,
    ...params
  });
  const { oldNewIdMap: sourceTargetPostCategoryHashmap } = await importPostCategories({
    targetSpaceIdOrDomain: targetSpace.id,
    exportData: {
      postCategories:
        postCategories ||
        (await prisma.postCategory.findMany({
          where: {
            id: {
              in: sourceProposalCategoryPermissions.map((p) => p.proposalCategoryId)
            }
          }
        }))
    }
  });

  // Match categories by title
  const postCategoryPermissionsToCreate: Prisma.PostCategoryPermissionCreateManyInput[] = sourcePostCategoryPermissions
    .map(({ assignee, postCategoryId, permissionLevel }) => {
      const assigneeId = (assignee as TargetPermissionGroup<'role' | 'space'>).id;
      const isRolePermission = assignee.group === 'role';
      const isSpacePermission = assignee.group === 'space';
      const matchingCategoryId = sourceTargetPostCategoryHashmap[postCategoryId];

      const isDuplicate = existingTargetSpacePostCategoryPermissions.some((existingPermission) => {
        if (!matchingCategoryId) {
          return false;
        }

        if (isRolePermission) {
          return (
            existingPermission.roleId === roleIdsHashMap[assigneeId] &&
            existingPermission.postCategoryId === sourceTargetPostCategoryHashmap[postCategoryId]
          );
        } else if (isSpacePermission) {
          return (
            existingPermission.spaceId === targetSpace.id && existingPermission.postCategoryId === matchingCategoryId
          );
        }

        return false;
      });

      if ((!isRolePermission && !isSpacePermission) || !matchingCategoryId || isDuplicate) {
        return null;
      }

      return {
        id: uuid(),
        spaceId: isSpacePermission ? targetSpace.id : undefined,
        roleId: isRolePermission ? roleIdsHashMap[assigneeId] : undefined,
        postCategoryId: matchingCategoryId,
        permissionLevel
      } as Prisma.PostCategoryPermissionCreateManyInput;
    })
    .filter((val) => !!val) as Prisma.PostCategoryPermissionCreateManyInput[];

  const { oldNewIdMap: sourceTargetProposalCategoryHashmap } = await importProposalCategories({
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

        const isDuplicate = existingTargetSpaceProposalCategoryPermissions.some((existingPermission) => {
          if (!matchingCategoryId) {
            return false;
          }

          if (isRolePermission) {
            return (
              existingPermission.roleId === roleIdsHashMap[assigneeId] &&
              existingPermission.proposalCategoryId === sourceTargetProposalCategoryHashmap[proposalCategoryId]
            );
          } else if (isSpacePermission) {
            return (
              existingPermission.spaceId === targetSpace.id &&
              existingPermission.proposalCategoryId === matchingCategoryId
            );
          }

          return false;
        });

        if ((!isRolePermission && !isSpacePermission) || !matchingCategoryId || isDuplicate) {
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

  // Map out space permissions
  const spacePermissionsToCreate: Prisma.SpacePermissionCreateManyInput[] = sourceSpacePermissions
    .map(({ assignee, operations }) => {
      const assigneeId = (assignee as TargetPermissionGroup<'role' | 'space'>).id;
      const isRolePermission = assignee.group === 'role';
      const isSpacePermission = assignee.group === 'space';

      const isDuplicate = existingTargetSpacePermissions.some((existingPermission) => {
        if (isRolePermission) {
          return existingPermission.roleId === roleIdsHashMap[assigneeId];
        } else if (isSpacePermission) {
          return existingPermission.spaceId === targetSpace.id;
        }

        return false;
      });

      if ((!isRolePermission && !isSpacePermission) || isDuplicate) {
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

  // Lock in changes inside the db for all permissions

  await prisma.postCategoryPermission.createMany({ data: postCategoryPermissionsToCreate });

  const updatedTargetPostCategoryPermissions = await prisma.postCategoryPermission
    .findMany({
      where: {
        postCategory: {
          spaceId: targetSpace.id
        }
      }
    })
    .then((_permissions) => _permissions.map(mapPostCategoryPermissionToAssignee));

  await prisma.proposalCategoryPermission.createMany({ data: proposalCategoryPermissionsToCreate });

  const updatedTargetProposalCategoryPermissions = await prisma.proposalCategoryPermission
    .findMany({
      where: {
        proposalCategory: {
          spaceId: targetSpace.id
        }
      }
    })
    .then((_permissions) => _permissions.map(mapProposalCategoryPermissionToAssignee));

  await prisma.spacePermission.createMany({ data: spacePermissionsToCreate });

  const updatedTargetSpacePermissions = await prisma.spacePermission
    .findMany({
      where: {
        forSpaceId: targetSpace.id
      }
    })
    .then((_permissions) => _permissions.map(mapSpacePermissionToAssignee));

  return {
    proposalCategoryPermissions: updatedTargetProposalCategoryPermissions as AssignedProposalCategoryPermission<
      'role' | 'space'
    >[],
    postCategoryPermissions: updatedTargetPostCategoryPermissions as AssignedPostCategoryPermission<'role' | 'space'>[],
    roles: importedRolesFromTemplate,
    spacePermissions: updatedTargetSpacePermissions
  };
}
