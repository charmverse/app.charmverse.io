import type { SpacePermission } from '@prisma/client';

import { prisma } from 'db';

import type { AssignedPostCategoryPermission } from '../forum/interfaces';
import { mapPostCategoryPermissionToAssignee } from '../forum/mapPostCategoryPermissionToAssignee';
import type { AssignedProposalCategoryPermission } from '../proposals/interfaces';
import { mapProposalCategoryPermissionToAssignee } from '../proposals/mapProposalCategoryPermissionToAssignee';

import type { SpacePermissionFlags } from './interfaces';

export type SpacePermissions = {
  standard: SpacePermission[];
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
    prisma.spacePermission.findMany({
      where: {
        forSpaceId: spaceId
      }
    })
  ]);

  return { proposalCategories, forumCategories, standard };
}
