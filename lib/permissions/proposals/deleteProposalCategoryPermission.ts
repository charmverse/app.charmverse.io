import { prisma } from 'db';

import type { PermissionToDelete } from '../interfaces';

export async function deleteProposalCategoryPermission({ permissionId }: PermissionToDelete) {
  const permission = await prisma.proposalCategoryPermission.findUnique({
    where: {
      id: permissionId
    }
  });

  if (!permission) {
    return;
  }
  return prisma.proposalCategoryPermission.delete({
    where: {
      id: permissionId
    }
  });
}
