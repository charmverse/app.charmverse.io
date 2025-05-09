import { log } from '@charmverse/core/log';
import type { PagesRequest } from '@charmverse/core/pages';
import type { Prisma, PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { createPage } from '@packages/pages/createPage';
import { replaceS3Domain } from '@packages/utils/url';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { PageMeta } from 'lib/pages/interfaces';
import { untitledPage } from 'lib/pages/untitledPage';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPages);

export const config = {
  api: {
    // silence errors about response size
    // https://nextjs.org/docs/messages/api-routes-response-size-limit
    responseLimit: false
  }
};

// A list of page types that do not appear in the sidebar, and therefore their children should not either
// Note we dont need to include board page type, since cards are not returned in this endpoint
const pageTypesHiddenFromSidebar: PageType[] = ['bounty', 'card', 'proposal'];

async function getPages(req: NextApiRequest, res: NextApiResponse<PageMeta[]>) {
  const userId = req.session?.user?.id;

  const spaceId = req.query.id as string;
  const { archived, limit, search, filter } = req.query as any as PagesRequest;
  const accessiblePageIds = await permissionsApiClient.pages.getAccessiblePageIds({
    spaceId,
    userId,
    archived,
    limit,
    filter,
    search
  });

  const pages = await prisma.page.findMany({
    where: {
      spaceId,
      id: {
        in: accessiblePageIds
      }
    },
    select: {
      id: true,
      deletedAt: true,
      deletedBy: true,
      createdAt: true,
      createdBy: true,
      updatedAt: true,
      updatedBy: true,
      title: true,
      headerImage: true,
      icon: true,
      path: true,
      parentId: true,
      spaceId: true,
      type: true,
      boardId: true,
      index: true,
      cardId: true,
      proposalId: true,
      bountyId: true,
      hasContent: true,
      galleryImage: true,
      lensPostLink: true,
      syncWithPageId: true,
      sourceTemplateId: true,
      parent: {
        select: {
          type: true
        }
      }
    }
  });

  pages.forEach((page) => {
    page.galleryImage = replaceS3Domain(page.galleryImage);
    page.headerImage = replaceS3Domain(page.headerImage);
    page.icon = replaceS3Domain(page.icon);
    // hide children of pages that do not belong in the sidebar
    if (page.parent?.type && pageTypesHiddenFromSidebar.includes(page.parent.type)) {
      (page as PageMeta).hideFromSidebar = true;
    }
    for (const [key, value] of Object.entries(page)) {
      if (value === null || page[key as keyof typeof page] === '') {
        delete page[key as keyof typeof page];
      }
    }
  });

  const createdPages: PageMeta[] = [];

  if (pages.length === 0 && !search) {
    const totalPages = await prisma.page.count({
      where: {
        spaceId
      }
    });

    if (totalPages === 0) {
      const createdPage = await createPage({
        data: untitledPage({
          userId,
          spaceId
        }) as Prisma.PageUncheckedCreateInput
      });

      await permissionsApiClient.pages.setupPagePermissionsAfterEvent({
        event: 'created',
        pageId: createdPage.id
      });

      createdPages.push(createdPage);
      log.warn(`Created default first page for space ${spaceId}`, { spaceId, userId });
    }
  }

  return res.status(200).json(pages.length ? pages : createdPages);
}

export default withSessionRoute(handler);
