import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { exportWorkspacePages } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

export type DuplicatePageResponse = {
  pages: PageMeta[];
  rootPageId: string;
  blocks: Block[];
};

export async function duplicatePage({
  pageId,
  parentId,
  spaceId
}: {
  parentId: string | null;
  pageId: string;
  spaceId: string;
}): Promise<DuplicatePageResponse> {
  const data = await exportWorkspacePages({
    sourceSpaceIdOrDomain: spaceId,
    rootPageIds: [pageId]
  });

  const { pages, rootPageIds, blockIds } = await importWorkspacePages({
    targetSpaceIdOrDomain: spaceId,
    exportData: data,
    parentId,
    updateTitle: true,
    includePermissions: true
  });

  if (rootPageIds.length > 1) {
    log.error(`[duplicate]: Found multiple rootPageIds for a single page duplication`, {
      pageId,
      totalRootPageIds: rootPageIds.length,
      spaceId
    });
  }

  const blocks = await prisma.block.findMany({
    where: {
      id: {
        in: blockIds
      }
    }
  });

  return {
    pages,
    rootPageId: rootPageIds[0],
    blocks
  };
}
