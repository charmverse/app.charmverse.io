import { prisma } from '@charmverse/core';
import type { PageType, Prisma } from '@prisma/client';

import type { IPageWithPermissions } from 'lib/pages/server';

type CurrentPageData = {
  id: string;
  type: PageType;
};

export async function updatePage(
  page: CurrentPageData,
  userId: string,
  updates: Prisma.PageUpdateInput
): Promise<IPageWithPermissions> {
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
