import type { Bounty, Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { onError, onNoMatch } from 'lib/middleware';
import { NotFoundError } from 'lib/middleware/errors';
import type { PublicPageResponse } from 'lib/pages/interfaces';
import { getPermissionsClient } from 'lib/permissions/api';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { isUUID } from 'lib/utilities/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPublicPage);

function recurse(node: PageContent, cb: (node: PageContent) => void) {
  if (node?.content) {
    node?.content.forEach((childNode) => {
      recurse(childNode, cb);
    });
  }

  cb(node);
}

async function filterPublicPages(pageIds: string[]) {
  // Check if the linked pages have public share access
  const publicPages = await prisma.pagePermission.findMany({
    where: {
      pageId: {
        in: pageIds
      }
    },
    select: {
      public: true,
      pageId: true
    }
  });

  // Filter the linked pages that is publicly available
  const publicPagesIds: string[] = [];
  publicPages.forEach((publicPage) => {
    if (publicPage.public) {
      publicPagesIds.push(publicPage.pageId);
    }
  });

  return publicPagesIds;
}

async function extractPageArtifacts(linkedPageIds: string[]) {
  const boards: Board[] = [];
  let views: BoardView[] = [];
  const cards: Card[] = [];
  // Filter the linked pages that is publicly available
  const publicPagesIds = await filterPublicPages(linkedPageIds);

  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          id: {
            in: publicPagesIds
          }
        },
        {
          rootId: {
            in: publicPagesIds
          }
        }
      ]
    }
  });

  const linkedSourceIds: string[] = [];

  blocks.forEach((block) => {
    if (block.type === 'board') {
      boards.push(block as unknown as Board);
    } else if (block.type === 'view') {
      const view = block as unknown as BoardView;
      views.push(view);
      if (view.fields?.linkedSourceId) {
        linkedSourceIds.push(view.fields.linkedSourceId);
      }
    } else if (block.type === 'card') {
      cards.push(block as unknown as Card);
    }
  });

  const publicLinkedSourceIds = await filterPublicPages(linkedSourceIds);

  const extraBlocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          id: {
            in: publicLinkedSourceIds
          }
        },
        {
          parentId: {
            in: publicLinkedSourceIds
          }
        }
      ]
    }
  });

  views = views.filter((view) => {
    // Don't show view for pages that are not publicly shared
    if (view.fields.linkedSourceId && !publicLinkedSourceIds.includes(view.fields.linkedSourceId)) {
      return false;
    }
    return true;
  });

  extraBlocks.forEach((block) => {
    if (block.type === 'board') {
      boards.push(block as unknown as Board);
    } else if (block.type === 'card') {
      cards.push(block as unknown as Card);
    }
  });

  return {
    cards,
    views,
    boards
  };
}

async function getPublicPage(req: NextApiRequest, res: NextApiResponse<PublicPageResponse>) {
  const { pageId: pageIdOrPath } = req.query as { pageId: string[] };

  const isPageId = typeof pageIdOrPath[0] === 'string' && isUUID(pageIdOrPath[0]);

  let page: Page | null = null;

  if (isPageId) {
    page = await prisma.page.findFirst({ where: { deletedAt: null, id: pageIdOrPath[0] } });
  }

  // Tuple array of path segments [spaceDomain, pagePath]

  const [spaceDomain, pagePath] = pageIdOrPath;

  if (!spaceDomain) {
    throw new NotFoundError('Space domain is required');
  }

  const space = await prisma.space.findFirst({
    where: page
      ? { id: page.spaceId }
      : {
          OR: [
            {
              customDomain: spaceDomain
            },
            { domain: spaceDomain }
          ]
        }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  if (pagePath && !page) {
    const trimmedPath = pagePath.trim();

    page = await prisma.page.findFirst({
      where: {
        deletedAt: null,
        space: {
          id: space.id
        },
        OR: [
          {
            path: trimmedPath
          },
          {
            additionalPaths: {
              has: trimmedPath
            }
          }
        ]
      }
    });
  }

  if (!page) {
    throw new NotFoundError('Page not found');
  }

  const computed = await getPermissionsClient({ resourceId: page.id, resourceIdType: 'page' }).then(({ client }) =>
    client.pages.computePagePermissions({
      resourceId: page!.id
    })
  );

  if (computed.read !== true && page.type !== 'bounty') {
    throw new NotFoundError('Page not found');
  } else if (computed.read !== true && page.type === 'bounty' && !space.publicBountyBoard) {
    throw new NotFoundError('Page not found');
  }

  const boardPages: Page[] = [];
  let boards: Board[] = [];
  let cards: Card[] = [];
  let views: BoardView[] = [];
  let bounty: Bounty | null = null;

  if (page.cardId && page.parentId) {
    const boardPage = await prisma.page.findFirst({
      where: {
        deletedAt: null,
        id: page.parentId
      }
    });
    if (boardPage) {
      boardPages.push(boardPage);
    }

    const card = (await prisma.block.findFirst({
      where: {
        deletedAt: null,
        id: page.cardId
      }
    })) as unknown as Card;

    if (card) {
      cards.push(card);
      // google synced cards have a board that is attached to another board, we need both boards
      const _boards = (await prisma.block.findMany({
        where: {
          deletedAt: null,
          id: {
            in: [card.parentId, card.rootId].filter(Boolean)
          }
        }
      })) as unknown as Board[];

      boards.push(..._boards);
    }
  } else if (page.type === 'page') {
    const linkedPageIds: string[] = [];
    recurse(page?.content as PageContent, (node) => {
      // Checking if all the mention attributes exist or not, and continue only if they exist
      if (node?.type === 'inlineDatabase' && node?.attrs) {
        // Some pageids are null
        if (node?.attrs.pageId) {
          linkedPageIds.push(node.attrs.pageId);
        }
      }
    });

    const { boards: linkedBoards, cards: linkedCards, views: linkedViews } = await extractPageArtifacts(linkedPageIds);
    boards = linkedBoards;
    cards = linkedCards;
    views = linkedViews;
  } else if (page.type === 'inline_linked_board' || page.type === 'linked_board') {
    const { boards: linkedBoards, cards: linkedCards, views: linkedViews } = await extractPageArtifacts([page.id]);
    boards = linkedBoards;
    cards = linkedCards;
    views = linkedViews;
  } else if (page.type === 'bounty') {
    bounty = await prisma.bounty.findUnique({
      where: {
        id: page.id
      }
    });
  }

  return res.status(200).json({
    bounty: bounty
      ? {
          ...bounty,
          page: {
            ...page,
            permissions: []
          },
          applications: []
        }
      : null,
    page: {
      ...page,
      permissionFlags: computed
    },
    boardPages,
    cards,
    boards,
    space,
    views
  });
}

export default withSessionRoute(handler);
