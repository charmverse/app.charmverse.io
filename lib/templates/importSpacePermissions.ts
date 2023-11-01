import { InvalidInputError } from '@charmverse/core/errors';
import {
  mapProposalCategoryPermissionToAssignee,
  type AssignedProposalCategoryPermission,
  type TargetPermissionGroup
} from '@charmverse/core/permissions';
import { prisma, type Prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { getImportData } from './getImportData';
import { importRoles } from './importRoles';
import type { ImportParams } from './interfaces';

export type ImportedPermissions = {
  proposalCategoryPermissions: AssignedProposalCategoryPermission[];
};

export async function importSpacePermissions({
  targetSpaceIdOrDomain,
  ...params
}: ImportParams): Promise<ImportedPermissions> {
  if (!targetSpaceIdOrDomain) {
    throw new InvalidInputError(`targetSpaceIdOrDomain is required`);
  }

  const isUuidValue = stringUtils.isUUID(targetSpaceIdOrDomain);

  const targetSpace = await prisma.space.findFirstOrThrow({
    where: {
      id: isUuidValue ? targetSpaceIdOrDomain : undefined,
      domain: !isUuidValue ? targetSpaceIdOrDomain : undefined
    }
  });

  const { permissions, roles } = await getImportData(params);

  const sourceProposalCategoryPermissions = [
    ...(permissions?.roles ?? []).map((role) => role.permissions.proposalCategoryPermissions).flat(),
    ...(permissions?.space.permissions.proposalCategoryPermissions ?? [])
  ];

  // Port over roles
  const { oldNewRecordIdHashMap: roleIdsHashMap, roles: importedRolesFromTemplate } = await importRoles({
    targetSpaceIdOrDomain,
    ...params
  });
  const sourceProposalCategories = await prisma.proposalCategory.findMany({
    where: {
      id: {
        in: sourceProposalCategoryPermissions.map((p) => p.proposalCategoryId)
      }
    },
    select: {
      id: true,
      title: true
    }
  });

  // Match categories by title
  const targetSpaceProposalCategories = await prisma.proposalCategory.findMany({
    where: {
      spaceId: targetSpace.id,
      title: {
        in: sourceProposalCategories.map((c) => c.title)
      }
    },
    select: {
      id: true,
      title: true
    }
  });

  const sourceTargetProposalCategoryHashmap = sourceProposalCategories.reduce((acc, sourceCategory) => {
    const matchingCategory = targetSpaceProposalCategories.find((c) => c.title === sourceCategory.id);

    acc[sourceCategory.id] = matchingCategory?.id;

    return acc;
  }, {} as Record<string, string | undefined>);

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
          spaceId: isSpacePermission ? roleIdsHashMap[assigneeId] : undefined,
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

  return {
    proposalCategoryPermissions: createdProposalCategoryPermissions
  };
}
