import type { Page, Prisma, PrismaPromise } from '@prisma/client';

import { prisma } from 'db';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { getPreviewImageFromContent } from 'lib/pages/getPreviewImageFromContent';
import type { PageContent } from 'models';

export function createPage<T> ({ data, include }: Prisma.PageCreateArgs): PrismaPromise<Page & T> {
  const createArgs: Prisma.PageCreateArgs = {
    data: {
      ...data,
      hasContent: data.content ? !checkIsContentEmpty(data.content as PageContent) : false,
      galleryImage: getPreviewImageFromContent(data.content as PageContent)
    }
  };

  const includeData = typeof include !== undefined ? include : {
    permissions: {
      include: {
        sourcePermission: true
      }
    }
  };

  createArgs.include = includeData;

  return prisma.page.create(createArgs) as unknown as PrismaPromise<Page & T>;

}
