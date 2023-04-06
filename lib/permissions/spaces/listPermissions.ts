import { prisma } from 'db';

import type { AssignedPostCategoryPermission } from '../forum/interfaces';
import { mapPostCategoryPermissionToAssignee } from '../forum/mapPostCategoryPermissionToAssignee';
import type { AssignedProposalCategoryPermission } from '../proposals/interfaces';
import { mapProposalCategoryPermissionToAssignee } from '../proposals/mapProposalCategoryPermissionToAssignee';

import type { AssignedSpacePermission } from './mapSpacePermissionToAssignee';
import { mapSpacePermissionToAssignee } from './mapSpacePermissionToAssignee';

export type SpacePermissions = {
  space: AssignedSpacePermission[];
  proposalCategories: AssignedProposalCategoryPermission[];
  forumCategories: AssignedPostCategoryPermission[];
};

export async function listPermissions({ spaceId }: { spaceId: string }): Promise<SpacePermissions> {
  const [proposalCategories, forumCategories, standard] = await Promise.all([
    prisma.proposalCategoryPermission
      .findMany({
        where: {
          proposalCategory: {
            spaceId
          }
        }
      })
      .then((permissions) => permissions.map(mapProposalCategoryPermissionToAssignee)),
    prisma.postCategoryPermission
      .findMany({
        where: {
          postCategory: {
            spaceId
          }
        }
      })
      .then((permissions) => permissions.map(mapPostCategoryPermissionToAssignee)),
    prisma.spacePermission
      .findMany({
        where: {
          forSpaceId: spaceId
        }
      })
      .then((permissions) =>
        permissions.map((permission) => ({
          id: permission.id,
          group: permission.forRoleId ? 'role' : 'space',
          permissionLevel: permission.operations
        }))
      )
  ]);

  return { proposalCategories, forumCategories, standard };
}
