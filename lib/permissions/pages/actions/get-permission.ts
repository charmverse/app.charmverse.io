import type { TransactionClient } from 'db';
import { prisma } from 'db';

import type { IPagePermissionWithSource } from '../page-permission-interfaces';

export async function getPagePermission (permissionId: string, tx: TransactionClient = prisma): Promise<IPagePermissionWithSource | null> {
  return tx.pagePermission.findUnique({
    where: {
      id: permissionId
    },
    include: {
      sourcePermission: true
    }
  });
}
