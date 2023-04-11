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
  const [proposalCategories, forumCategories, space] = await Promise.all([
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
      .then((permissions) => permissions.map(mapSpacePermissionToAssignee))
  ]);

  // add default member permissions if not defined
  if (space.filter((s) => s.assignee.group === 'space').length === 0) {
    space.push({
      assignee: {
        group: 'space',
        id: spaceId
      },
      operations: {
        createPage: false,
        createBounty: false,
        createForumCategory: false,
        moderateForums: false,
        reviewProposals: false
      }
    });
  }

  return { proposalCategories, forumCategories, space };
}
