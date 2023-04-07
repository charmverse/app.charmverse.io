import { prisma } from 'db';

import type { AssignedPostCategoryPermission } from '../forum/interfaces';
import { mapPostCategoryPermissionToAssignee } from '../forum/mapPostCategoryPermissionToAssignee';
import type { AssignedProposalCategoryPermission } from '../proposals/interfaces';
import { mapProposalCategoryPermissionToAssignee } from '../proposals/mapProposalCategoryPermissionToAssignee';

import type { SpacePermissions } from './listPermissions';
import type { AssignedSpacePermission } from './mapSpacePermissionToAssignee';
import { mapSpacePermissionToAssignee } from './mapSpacePermissionToAssignee';

export async function savePermissions(permissions: SpacePermissions) {
  // const [proposalCategories, forumCategories, space] = await Promise.all([
  //   prisma.proposalCategoryPermission
  //     .findMany({
  //       where: {
  //         proposalCategory: {
  //           spaceId
  //         }
  //       }
  //     })
  //     .then((permissions) => permissions.map(mapProposalCategoryPermissionToAssignee)),
  //   prisma.postCategoryPermission
  //     .findMany({
  //       where: {
  //         postCategory: {
  //           spaceId
  //         }
  //       }
  //     })
  //     .then((permissions) => permissions.map(mapPostCategoryPermissionToAssignee)),
  //   prisma.spacePermission
  //     .findMany({
  //       where: {
  //         forSpaceId: spaceId
  //       }
  //     })
  //     .then((permissions) => permissions.map(mapSpacePermissionToAssignee))
  // ]);
}
