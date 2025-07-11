import { prisma } from '@charmverse/core/prisma-client';
import type { PageMeta } from '@packages/core/pages';

import { pageMetaSelect } from './pageMetaSelect';

export function getPageMetaList(pageIds: string[]): Promise<PageMeta[]> {
  return prisma.page.findMany({
    where: {
      id: {
        in: pageIds
      }
    },
    select: pageMetaSelect()
  });
}
