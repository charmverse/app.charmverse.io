import { InvalidInputError } from '@charmverse/core/errors';
import {
  mapProposalCategoryPermissionToAssignee,
  type AssignedProposalCategoryPermission
} from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type ExportedPermissions = {
  proposalCategoryPermissions: AssignedProposalCategoryPermission[];
  proposalsWithReviewerPermission: string[];
  rewardsWithReviewerPermission: string[];
};

export type ExportedPermissionsByGroup = {
  roles: { id: string; permissions: ExportedPermissions }[];
  space: { id: string; permissions: ExportedPermissions };
};
export async function exportSpacePermissions({ spaceId }: { spaceId: string }): Promise<ExportedPermissionsByGroup> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid space id: ${spaceId}`);
  }

  const [proposalCategoryPermissions, proposalsWithReviewerPermission, rewardsWithReviewerPermission] =
    await Promise.all([
      prisma.proposalCategoryPermission.findMany({
        where: {
          proposalCategory: {
            spaceId
          }
        }
      }),
      prisma.proposalReviewer.findMany({
        where: {
          proposal: {
            spaceId
          },
          roleId: {
            not: null
          }
        }
      }),
      prisma.bountyPermission.findMany({
        where: {
          bounty: {
            spaceId
          },
          permissionLevel: 'reviewer',
          roleId: {
            not: null
          }
        }
      })
    ]);

  // Transform data into the ExportedPermissions format
  const rolePermissions = new Map<string, ExportedPermissions>();

  // Process each data set, ensuring roleId is not null
  proposalCategoryPermissions.forEach((pcp) => {
    if (pcp.roleId) {
      const permissions = rolePermissions.get(pcp.roleId) || {
        proposalCategoryPermissions: [],
        proposalsWithReviewerPermission: [],
        rewardsWithReviewerPermission: []
      };
      permissions.proposalCategoryPermissions.push(mapProposalCategoryPermissionToAssignee(pcp));
      rolePermissions.set(pcp.roleId, permissions);
    }
  });

  proposalsWithReviewerPermission.forEach((prp) => {
    if (prp.roleId) {
      const permissions = rolePermissions.get(prp.roleId) || {
        proposalCategoryPermissions: [],
        proposalsWithReviewerPermission: [],
        rewardsWithReviewerPermission: []
      };
      permissions.proposalsWithReviewerPermission.push(prp.proposalId);
      rolePermissions.set(prp.roleId, permissions);
    }
  });

  rewardsWithReviewerPermission.forEach((rwrp) => {
    if (rwrp.roleId) {
      const permissions = rolePermissions.get(rwrp.roleId) || {
        proposalCategoryPermissions: [],
        proposalsWithReviewerPermission: [],
        rewardsWithReviewerPermission: []
      };
      permissions.rewardsWithReviewerPermission.push(rwrp.bountyId);
      rolePermissions.set(rwrp.roleId, permissions);
    }
  });

  // Map the permissions into the expected output format
  const exportedPermissionsByGroup: ExportedPermissionsByGroup = {
    roles: Array.from(rolePermissions.keys()).map((roleId) => ({
      id: roleId,
      permissions: rolePermissions.get(roleId) as ExportedPermissions
    })),
    space: {
      id: spaceId,
      permissions: {
        proposalCategoryPermissions: proposalCategoryPermissions
          .filter((pcp) => pcp.spaceId)
          .map(mapProposalCategoryPermissionToAssignee),
        proposalsWithReviewerPermission: [],
        rewardsWithReviewerPermission: []
      }
    }
  };

  return exportedPermissionsByGroup;
}
