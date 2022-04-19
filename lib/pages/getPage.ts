import { prisma } from 'db';
import { IPageWithPermissions } from './interfaces';

export async function getPage (pageId: string): Promise<IPageWithPermissions | null> {
  return prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });
}

