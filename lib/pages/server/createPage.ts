import { prisma } from 'db';
import type { Page, Prisma, PrismaPromise } from '@prisma/client';

import type { PageContent } from 'models';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { getPreviewImageFromContent } from 'lib/pages/getPreviewImageFromContent';

export function createPage<T> ({ data, include }: Prisma.PageCreateArgs): PrismaPromise<Page & T> {
  const pageData = {
    ...data,
    hasContent: data.content ? !checkIsContentEmpty(data.content as PageContent) : false,
    galleryImg: getPreviewImageFromContent(data.content as PageContent)
  };

  const includeData = include || {
    permissions: {
      include: {
        sourcePermission: true
      }
    }
  };

  return prisma.page.create({
    data: pageData,
    include: includeData
  }) as unknown as PrismaPromise<Page & T>;

}
