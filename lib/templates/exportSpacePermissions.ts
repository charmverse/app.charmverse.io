import { InvalidInputError } from '@charmverse/core/errors';
import {
  mapProposalCategoryPermissionToAssignee,
  type AssignedProposalCategoryPermission
} from '@charmverse/core/permissions';
import type { Role } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import {
  mapSpacePermissionToAssignee,
  type AssignedSpacePermission
} from 'lib/permissions/spaces/mapSpacePermissionToAssignee';

import { exportRoles } from './exportRoles';

export type ExportedPermissions = {
  proposalCategoryPermissions: AssignedProposalCategoryPermission<'role' | 'space'>[];
  spacePermissions: AssignedSpacePermission[];
};

export type SpacePermissionsExport = {
  roles: Role[];
  permissions: ExportedPermissions;
};
export async function exportSpacePermissions({ spaceId }: { spaceId: string }): Promise<SpacePermissionsExport> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid space id: ${spaceId}`);
  }

  const { roles } = await exportRoles({ spaceIdOrDomain: spaceId });

  const [proposalCategoryPermissions, spacePermissions] = await Promise.all([
    prisma.proposalCategoryPermission.findMany({
      where: {
        proposalCategory: {
          spaceId
        },
        OR: [
          {
            spaceId: {
              not: null
            }
          },
          {
            roleId: {
              not: null
            }
          }
        ]
      }
    }),
    prisma.spacePermission.findMany({
      where: {
        forSpaceId: spaceId,
        OR: [
          {
            spaceId: {
              not: null
            }
          },
          {
            roleId: {
              not: null
            }
          }
        ]
      }
    })
  ]);

  const permissions: ExportedPermissions = {
    proposalCategoryPermissions: proposalCategoryPermissions.map(
      mapProposalCategoryPermissionToAssignee
    ) as AssignedProposalCategoryPermission<'role' | 'space'>[],
    spacePermissions: spacePermissions.map(mapSpacePermissionToAssignee)
  };

  return { roles, permissions };
}
