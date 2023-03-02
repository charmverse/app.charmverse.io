import { prisma } from 'db';
import { exportWorkspacePages } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

import { PageNotFoundError } from './server';

export async function duplicatePage({ pageId, parentId }: { parentId?: string | null; pageId: string }) {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const spaceId = page.spaceId;

  const { data } = await exportWorkspacePages({
    sourceSpaceIdOrDomain: spaceId,
    rootPageIds: [pageId]
  });

  const { pages, rootPageIds } = await importWorkspacePages({
    targetSpaceIdOrDomain: spaceId,
    exportData: data,
    parentId,
    updateTitle: true
  });

  return {
    pages,
    rootPageIds
  };
}
