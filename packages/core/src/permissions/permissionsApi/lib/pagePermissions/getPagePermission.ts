import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { PagePermissionWithSource } from '@packages/core/permissions';

import { PagePermissionNotFoundError } from './errors';

type GetPagePermissionInput = {
  permissionId: string;
  tx?: Prisma.TransactionClient;
};

export async function getPagePermission({
  permissionId,
  tx = prisma
}: GetPagePermissionInput): Promise<PagePermissionWithSource> {
  const permission = await tx.pagePermission.findUnique({
    where: {
      id: permissionId
    },
    include: {
      sourcePermission: true
    }
  });

  if (!permission) {
    throw new PagePermissionNotFoundError(permissionId);
  }

  return permission;
}
