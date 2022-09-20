import { prisma } from 'db';
import type { IPagePermissionWithSource } from '../page-permission-interfaces';

export async function getPagePermission (permissionId: string): Promise<IPagePermissionWithSource | null> {
  return prisma.pagePermission.findUnique({
    where: {
      id: permissionId
    },
    include: {
      sourcePermission: true
    }
  });
}
