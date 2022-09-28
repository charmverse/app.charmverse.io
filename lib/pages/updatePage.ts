import { prisma } from 'db';
import type { Block, PageType, Prisma } from '@prisma/client';
import type { IPageWithPermissions } from 'lib/pages/server';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import type { PageContent } from 'models';
import { getPreviewImageFromContent } from 'lib/pages/getPreviewImageFromContent';

type CurrentPageData = {
  id: string;
  type: PageType;
}

export async function updatePage (page: CurrentPageData, userId: string, updates: Prisma.PageUpdateInput): Promise<IPageWithPermissions> {
  const data: Prisma.PageUpdateInput = {
    ...updates,
    updatedAt: new Date(),
    updatedBy: userId
  };

  let fallbackPreviewUrl: string | null = null;

  // check if content is empty only if it got changed
  if ('content' in updates) {
    data.hasContent = !checkIsContentEmpty(updates.content as PageContent);

    if (page.type === 'card') {
      fallbackPreviewUrl = getPreviewImageFromContent(updates.content as PageContent);
    }
  }

  return prisma.$transaction(async tx => {
    if (typeof fallbackPreviewUrl === 'string') {
      await tx.block.update({ where: { id: page.id }, data: { fallbackPreviewUrl } });
    }

    return tx.page.update({
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
  });
}
