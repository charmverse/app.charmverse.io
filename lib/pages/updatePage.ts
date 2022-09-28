import { prisma } from 'db';
import type { Prisma } from '@prisma/client';
import type { IPageWithPermissions } from 'lib/pages/server';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import type { PageContent } from 'models';

export async function updatePage (pageId: string, userId: string, updates: Prisma.PageUpdateInput): Promise<IPageWithPermissions> {
  const data: Prisma.PageUpdateInput = {
    ...updates,
    updatedAt: new Date(),
    updatedBy: userId
  };

  // check if content is empty only if it got changed
  if ('content' in updates) {
    data.hasContent = !checkIsContentEmpty(updates.content as PageContent);
  }

  return prisma.page.update({
    where: {
      id: pageId
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
