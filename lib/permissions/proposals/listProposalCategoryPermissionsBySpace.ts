import { prisma } from 'db';

import type { AssignedProposalCategoryPermission } from './interfaces';
import { mapProposalCategoryPermissionToAssignee } from './mapProposalCategoryPermissionToAssignee';

export async function listProposalCategoryPermissionsBySpace({
  spaceId
}: {
  spaceId: string;
}): Promise<AssignedProposalCategoryPermission[]> {
  const permissions = await prisma.proposalCategoryPermission.findMany({
    where: {
      proposalCategory: {
        spaceId
      }
    }
  });

  return permissions.map(mapProposalCategoryPermissionToAssignee);
}
