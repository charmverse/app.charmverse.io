import type { Prisma } from '@charmverse/core/prisma';
import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { PageMeta } from '@packages/core/pages';
import { pageMetaSelect } from '@packages/pages/pageMetaSelect';
import { generatePagePathFromPathAndTitle } from '@packages/pages/utils';

type CurrentPageData = Pick<Page, 'id' | 'type' | 'path' | 'additionalPaths'>;

export async function updatePage(
  page: CurrentPageData,
  userId: string,
  updates: Prisma.PageUpdateInput
): Promise<PageMeta> {
  const data: Prisma.PageUpdateInput = {
    ...updates,
    updatedAt: new Date(),
    updatedBy: userId,
    // Dont' enable manual path updates
    path: undefined
  };

  if (data.id) {
    // avoid overriding page id
    delete data.id;
  }

  // TODO - Figure out encoding edge cases (special chars / japanese chars)
  if (data.title) {
    const newPath = generatePagePathFromPathAndTitle({
      existingPagePath: page.path,
      title: data.title as string
    });

    if (!page.additionalPaths.includes(page.path)) {
      page.additionalPaths.push(page.path);
    }

    if (!page.additionalPaths.includes(newPath)) {
      data.additionalPaths = [newPath, ...page.additionalPaths];
    }

    data.path = newPath;
  }

  await prisma.page.update({
    where: { id: page.id },
    data
  });

  // keeps some fields in sync
  if (data.title) {
    await prisma.page.updateMany({
      where: { syncWithPageId: page.id },
      data: {
        title: data.title
      }
    });
  }

  return prisma.page.findUniqueOrThrow({
    where: {
      id: page.id
    },
    select: pageMetaSelect()
  }) as Promise<PageMeta>;
}
