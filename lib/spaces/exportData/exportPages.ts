import { Page } from '@prisma/client';
import { prisma } from 'db';
import { PageWithChildren, resolveChildPages } from 'lib/pages/server';

export async function exportSpacePages ({ spaceId }: {spaceId: string}): Promise<Omit<PageWithChildren, 'permissions'>[]> {
  const rootPages = await prisma.page.findMany({
    where: {
      parentId: null,
      spaceId
    }
  });

  const rootsWithChildren = await Promise.all(rootPages.map(async p => {
    const children = await resolveChildPages(p.id, false);
    return {
      ...p,
      children
    };
  }));

  return rootsWithChildren;
}
