import type { AssignedPostCategoryPermission, AssignedProposalCategoryPermission } from '@charmverse/core/permissions';
import { mapProposalCategoryPermissionToAssignee } from '@charmverse/core/permissions';
import type { Role } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { mapPostCategoryPermissionToAssignee } from 'lib/permissions/forum/mapPostCategoryPermissionToAssignee';
import {
  mapSpacePermissionToAssignee,
  type AssignedSpacePermission
} from 'lib/permissions/spaces/mapSpacePermissionToAssignee';
import { getSpace } from 'lib/spaces/getSpace';

import { exportRoles } from './exportRoles';

export type ExportedPermissions = {
  proposalCategoryPermissions: AssignedProposalCategoryPermission<'role' | 'space'>[];
  postCategoryPermissions: AssignedPostCategoryPermission<'role' | 'space'>[];
  spacePermissions: AssignedSpacePermission[];
};

export type SpacePermissionsExport = {
  roles: Role[];
  permissions: ExportedPermissions;
};
export async function exportSpacePermissions({
  spaceIdOrDomain
}: {
  spaceIdOrDomain: string;
}): Promise<SpacePermissionsExport> {
  const space = await getSpace(spaceIdOrDomain);

  const { roles } = await exportRoles({ spaceIdOrDomain });

  const [proposalCategoryPermissions, postCategoryPermissions, spacePermissions] = await Promise.all([
    prisma.proposalCategoryPermission.findMany({
      where: {
        proposalCategory: {
          spaceId: space.id
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
    prisma.postCategoryPermission.findMany({
      where: {
        postCategory: {
          spaceId: space.id
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
        forSpaceId: space.id,
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
    postCategoryPermissions: postCategoryPermissions.map(
      mapPostCategoryPermissionToAssignee
    ) as AssignedPostCategoryPermission<'role' | 'space'>[],
    spacePermissions: spacePermissions.map(mapSpacePermissionToAssignee)
  };

  return { roles, permissions };
}
