import type { AssignedPostCategoryPermission } from '@charmverse/core/permissions';
import type { Role } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { mapPostCategoryPermissionToAssignee } from '@packages/lib/permissions/forum/mapPostCategoryPermissionToAssignee';
import {
  mapSpacePermissionToAssignee,
  type AssignedSpacePermission
} from '@packages/lib/permissions/spaces/mapSpacePermissionToAssignee';

import { getSpace } from 'lib/spaces/getSpace';

import { exportRoles } from './exportRoles';

export type ExportedPermissions = {
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

  const [postCategoryPermissions, spacePermissions] = await Promise.all([
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
    postCategoryPermissions: postCategoryPermissions.map(
      mapPostCategoryPermissionToAssignee
    ) as AssignedPostCategoryPermission<'role' | 'space'>[],
    spacePermissions: spacePermissions.map(mapSpacePermissionToAssignee)
  };

  return { roles, permissions };
}
