import type { PageWithPermissions } from '@charmverse/core';
import type { PageType, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

type CurrentPageData = {
  id: string;
  type: PageType;
};

export async function updatePage(
  page: CurrentPageData,
  userId: string,
  updates: Prisma.PageUpdateInput
): Promise<PageWithPermissions> {
  const data: Prisma.PageUpdateInput = {
    ...updates,
    updatedAt: new Date(),
    updatedBy: userId
  };

  if (data.id) {
    // avoid overriding page id
    delete data.id;
  }

  return prisma.page.update({
    where: {
      id: page.id
    },
    data,
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });
}
