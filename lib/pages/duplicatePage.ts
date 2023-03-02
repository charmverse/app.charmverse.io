import { prisma } from 'db';
import type { BountyWithDetails } from 'lib/bounties';
import { exportWorkspacePages } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

import type { DuplicatePageResponse } from './server';
import { includePagePermissions, PageNotFoundError } from './server';

export async function duplicatePage({
  pageId,
  parentId
}: {
  parentId?: string | null;
  pageId: string;
}): Promise<DuplicatePageResponse> {
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

  const bounties = await prisma.bounty.findMany({
    where: {
      id: {
        in: pages
          .filter((createdPage) => createdPage.bountyId && createdPage.type === 'bounty')
          .map((createdPage) => createdPage.bountyId as string)
      }
    },
    include: {
      applications: true,
      page: {
        include: includePagePermissions()
      }
    }
  });

  return {
    pages,
    rootPageIds,
    bounties: bounties as BountyWithDetails[]
  };
}
