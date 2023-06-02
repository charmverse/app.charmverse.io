import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { IPagePermissionWithSource } from '../page-permission-interfaces';

export async function getPagePermission(
  permissionId: string,
  tx: PrismaTransactionClient = prisma
): Promise<IPagePermissionWithSource | null> {
  return tx.pagePermission.findUnique({
    where: {
      id: permissionId
    },
    include: {
      sourcePermission: true
    }
  });
}
