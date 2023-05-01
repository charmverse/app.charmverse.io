import { prisma } from '@charmverse/core';

import log from 'lib/log';

import type { PermissionToDelete } from '../interfaces';

export async function deleteProposalCategoryPermission({ permissionId }: PermissionToDelete) {
  const permission = await prisma.proposalCategoryPermission.findUnique({
    where: {
      id: permissionId
    }
  });

  if (!permission) {
    log.warn(`Unexpected delete request for proposal category permission ${permissionId} - permission not found`);
    return;
  }
  return prisma.proposalCategoryPermission.delete({
    where: {
      id: permissionId
    }
  });
}
