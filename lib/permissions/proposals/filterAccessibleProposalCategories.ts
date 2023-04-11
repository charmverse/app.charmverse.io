import type { ProposalCategory, ProposalCategoryPermission, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { uniqueValues } from 'lib/utilities/array';
import { InvalidInputError } from 'lib/utilities/errors';

import { AvailableProposalCategoryPermissions } from './availableProposalCategoryPermissions.class';
import type { ProposalCategoryWithPermissions } from './interfaces';
import { proposalCategoryPermissionsMapping } from './mapping';

type CategoriesToFilter = {
  proposalCategories: ProposalCategory[];
  userId?: string;
};
export async function filterAccessibleProposalCategories({
  proposalCategories,
  userId
}: CategoriesToFilter): Promise<ProposalCategoryWithPermissions[]> {
  // Avoid expensive computation
  if (proposalCategories.length === 0) {
    return [];
  }

  const uniqueSpaceIds = uniqueValues(proposalCategories.map((category) => category.spaceId));

  if (uniqueSpaceIds.length > 1) {
    throw new InvalidInputError(`Cannot filter categories from multiple spaces at once.`);
  }

  const spaceId = uniqueSpaceIds[0];

  const { error, isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (isAdmin) {
    const permissions = new AvailableProposalCategoryPermissions().full;

    return proposalCategories.map((c) => ({ ...c, permissions }));
  }

  const proposalCategoryIds = proposalCategories.map((category) => category.id);

  // Handle non member case
  if (error || !spaceRole) {
    const publicCategoryPermissions = await prisma.proposalCategoryPermission.findMany({
      where: {
        public: true,
        proposalCategoryId: {
          in: proposalCategoryIds
        }
      }
    });

    const permissions = new AvailableProposalCategoryPermissions().empty;

    return proposalCategories
      .filter((category) =>
        publicCategoryPermissions.some((permission) => permission.proposalCategoryId === category.id)
      )
      .map((c) => ({ ...c, permissions }));
  } else {
    const userRolesInSpace = await prisma.spaceRoleToRole.findMany({
      where: {
        spaceRoleId: spaceRole.id
      },
      select: {
        roleId: true
      }
    });

    const roleIds = userRolesInSpace.map((spaceRoleToRole) => spaceRoleToRole.roleId);

    const orQuery: Prisma.ProposalCategoryPermissionWhereInput[] = [
      {
        spaceId
      },
      {
        public: true
      }
    ];

    if (roleIds.length > 0) {
      orQuery.push({
        roleId: {
          in: roleIds
        }
      });
    }
    const proposalCategoryPermissions = await prisma.proposalCategoryPermission.findMany({
      where: {
        proposalCategoryId: {
          in: proposalCategoryIds
        },
        OR: orQuery
      }
    });
    const mappedProposalCategoryPermissions = proposalCategoryPermissions.reduce((acc, permission) => {
      if (!acc[permission.proposalCategoryId]) {
        acc[permission.proposalCategoryId] = [];
      }

      acc[permission.proposalCategoryId].push(permission);
      return acc;
    }, {} as Record<string, ProposalCategoryPermission[]>);
    const filteredProposalCategory = proposalCategories.filter((category) => {
      const relevantPermissions = mappedProposalCategoryPermissions[category.id];

      if (!relevantPermissions || relevantPermissions.length === 0) {
        return false;
      }

      return true;
    });

    return filteredProposalCategory.map((category) => {
      const permissions = new AvailableProposalCategoryPermissions();
      const relevantPermissions = mappedProposalCategoryPermissions[category.id];

      relevantPermissions?.forEach((perm) => {
        permissions.addPermissions(proposalCategoryPermissionsMapping[perm.permissionLevel]);
      });

      (category as ProposalCategoryWithPermissions).permissions = permissions.operationFlags;

      return category;
    }) as ProposalCategoryWithPermissions[];
  }
}
