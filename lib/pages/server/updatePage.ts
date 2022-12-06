import type { PageType, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { getPreviewImageFromContent } from 'lib/pages/getPreviewImageFromContent';
import type { IPageWithPermissions } from 'lib/pages/server';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'models';

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
    updatedAt: new Date(),
    ...updates,
    updatedBy: userId
  };

  if (data.id) {
    // avoid overriding page id
    delete data.id;
  }

  // check if content is empty only if it got changed
  if ('content' in updates) {
    data.hasContent = !checkIsContentEmpty(updates.content as PageContent);

    if (page.type === 'card') {
      data.galleryImage = getPreviewImageFromContent(updates.content as PageContent);
    }
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
