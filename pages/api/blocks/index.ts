import { log } from '@charmverse/core/log';
import { copyAllPagePermissions } from '@charmverse/core/permissions';
import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BlockWithDetails } from 'lib/databases/block';
import { prismaToBlock, prismaToUIBlock } from 'lib/databases/block';
import type { BoardFields } from 'lib/databases/board';
import type { BoardViewFields } from 'lib/databases/boardView';
import {
  ActionNotPermittedError,
  InvalidStateError,
  NotFoundError,
  onError,
  onNoMatch,
  requireUser
} from 'lib/middleware';
import { createPage } from 'lib/pages/server/createPage';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { getPagePath } from 'lib/pages/utils';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { getCustomDomainFromHost } from 'lib/utils/domains/getCustomDomainFromHost';
import { getSpaceDomainFromHost } from 'lib/utils/domains/getSpaceDomainFromHost';
import { UnauthorisedActionError } from 'lib/utils/errors';
import { isTruthy } from 'lib/utils/types';
import { relay } from 'lib/websockets/relay';

export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createBlocks).put(updateBlocks).delete(deleteBlocks);

async function createBlocks(req: NextApiRequest, res: NextApiResponse<Omit<BlockWithDetails, ServerBlockFields>[]>) {
  const data = req.body as Omit<BlockWithDetails, ServerBlockFields>[];
  const referer = req.headers.referer as string;
  const url = new URL(referer);
  url.hash = '';
  url.search = '';
  const domain = getSpaceDomainFromHost(req.headers.host);
  const customDomain = getCustomDomainFromHost(req.headers.host);
  let spaceDomain = customDomain || domain;

  if (!spaceDomain) {
    spaceDomain = referer ? url.pathname.split('/')[1] : null;
  }

  if (!spaceDomain) {
    return res.status(200).json(data);
  }

  const space = await getSpaceByDomain(spaceDomain);
  if (!space) {
    throw new NotFoundError('space not found');
  }

  const { error } = await hasAccessToSpace({ userId: req.session.user.id, spaceId: space.id });
  if (error) {
    throw new UnauthorisedActionError();
  }

  // Make sure we can't create a card in a proposals database
  if (data.length === 1 && data[0].type === 'card' && data[0].parentId) {
    const candidateParentId = data[0].parentId;
    const [candidateParentBoardPage, candidateParentProposalViewBlocks] = await Promise.all([
      prisma.block.findUniqueOrThrow({
        where: {
          id: candidateParentId
        },
        select: {
          type: true,
          fields: true
        }
      }),
      prisma.block.findMany({
        where: {
          type: 'view',
          rootId: candidateParentId
        }
      })
    ]);

    if ((candidateParentBoardPage?.fields as any as BoardFields).sourceType === 'proposals') {
      if (data[0].id) {
        // we pre-emptively add the card to the cardOrder prop. This prevents invalid property IDs building up in the cardOrder prop
        const viewsToClean = candidateParentProposalViewBlocks.filter((viewBlock) =>
          (viewBlock.fields as BoardViewFields).cardOrder.includes(data[0].id as string)
        );
        if (viewsToClean.length > 0) {
          await prisma.$transaction(
            viewsToClean.map((viewBlock) =>
              prisma.block.update({
                where: {
                  id: viewBlock.id
                },
                data: {
                  fields: {
                    ...(viewBlock.fields as any),
                    cardOrder: (viewBlock.fields as BoardViewFields).cardOrder.filter((cardId) => cardId !== data[0].id)
                  }
                }
              })
            )
          );
        }
      }

      throw new InvalidStateError(`You can't create a card in a proposals database`);
    }
  }

  const newBlocks = data.map((block) => {
    return {
      ...block,
      fields: block.fields as any,
      parentId: block.parentId || '',
      schema: 1,
      spaceId: space.id,
      title: block.title || '',
      createdBy: req.session.user.id,
      updatedBy: req.session.user.id,
      deletedAt: null
    };
  });

  const cardBlocks = newBlocks.filter((newBlock) => newBlock.type === 'card');

  const parentPageIds = cardBlocks.map((block) => block.parentId).filter(isTruthy);

  const parentPages = await prisma.page.findMany({
    where: {
      id: {
        in: parentPageIds
      }
    },
    select: {
      id: true,
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  const cardPageQueries = cardBlocks
    .map((cardBlock) => {
      const parentPage = parentPages.find((p) => p.id === cardBlock.parentId);

      if (!parentPage) {
        return null;
      }

      // Since we are certain the card is leaf node, we can instantiate permissions directly here without the need for complex checks
      const initialPermissions = copyAllPagePermissions({
        permissions: parentPage.permissions,
        inheritFrom: true,
        newPageId: cardBlock.id
      });

      initialPermissions.data = (initialPermissions.data as any[]).map((permission) => {
        delete permission.pageId;

        return {
          ...permission
        };
      });

      const cardFields = cardBlock.fields as any;

      const cardPage: Prisma.PageCreateInput = {
        author: {
          connect: {
            id: cardBlock.createdBy
          }
        },
        updatedBy: cardBlock.updatedBy,
        id: cardBlock.id,
        space: {
          connect: {
            id: cardBlock.spaceId
          }
        },
        card: {
          connect: {
            id: cardBlock.id
          }
        },
        createdAt: cardBlock.createdAt,
        path: getPagePath(),
        title: cardBlock.title || '',
        icon: cardFields.icon,
        type: cardFields.isTemplate ? 'card_template' : 'card',
        headerImage: cardFields.headerImage,
        contentText: cardFields.contentText || '',
        parent: {
          connect: {
            id: cardBlock.parentId
          }
        },
        updatedAt: cardBlock.updatedAt,
        content: cardFields.content ?? undefined,
        permissions: {
          createMany: initialPermissions
        }
      };
      delete cardFields.content;
      delete cardFields.contentText;
      delete cardFields.headerImage;
      delete cardFields.icon;
      return cardPage;
    })
    .filter(isTruthy)
    .map((_data) =>
      createPage({
        data: _data
      })
    );

  await prisma.$transaction([
    prisma.block.createMany({
      data: newBlocks
    }),
    ...cardPageQueries
  ]);

  const blocksToNotify = await prisma.block.findMany({
    where: {
      id: {
        in: newBlocks.map((b) => b.id)
      }
    },
    include: {
      page: true
    }
  });
  const boardIds = blocksToNotify.filter((b) => b.type === 'board').map((b) => b.id);
  const boardPages = boardIds.length ? await getPageMetaList(boardIds) : [];

  relay.broadcast(
    {
      type: 'blocks_created',
      payload: blocksToNotify.map((block) => {
        const blockPage = block.page || boardPages.find((p) => p.id === block.id);
        if (blockPage) {
          return prismaToUIBlock(block, blockPage);
        }
        return prismaToBlock(block);
      })
    },
    space.id
  );
  if (boardPages.length) {
    relay.broadcast(
      {
        type: 'pages_created',
        payload: boardPages
      },
      space.id
    );
  }

  return res.status(201).json(newBlocks);
}

async function updateBlocks(req: NextApiRequest, res: NextApiResponse<BlockWithDetails[]>) {
  const userId = req.session.user.id;
  const blocks: BlockWithDetails[] = req.body;
  const dbBlocks = await prisma.block.findMany({
    where: {
      id: {
        in: blocks.map((block) => block.id)
      }
    },
    select: {
      id: true,
      rootId: true,
      type: true,
      spaceId: true,
      fields: true,
      title: true
    }
  });

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: [...dbBlocks.map((block) => block.id), ...dbBlocks.map((b) => b.rootId)]
      }
    },
    select: {
      id: true,
      isLocked: true,
      type: true
    }
  });

  const pagePermissions = await permissionsApiClient.pages.bulkComputePagePermissions({
    pageIds: pages.map((p) => p.id),
    userId
  });

  for (const block of dbBlocks) {
    const targetPageId = block.type === 'view' ? block.rootId : block.id;

    // dont throw an error if we didnt retrieve permissions for some reason
    if (pagePermissions[targetPageId] && !pagePermissions[targetPageId].edit_content) {
      throw new ActionNotPermittedError('You do not have permission to edit this page');
    } else if (!pagePermissions[targetPageId]) {
      log.warn('Did not retrieve permissions for page when updating a block', {
        pageId: targetPageId,
        blockId: block.id,
        blockRootId: block.rootId,
        userId
      });
    }
  }

  // validate access to the space
  const spaceIds: Record<string, boolean> = {};
  await Promise.all(
    blocks.map(async (block) => {
      const dbBlock = dbBlocks.find((b) => b.id === block.id);
      const spaceId = block.spaceId ?? dbBlock?.spaceId;
      if (!spaceIds[spaceId]) {
        const { error } = await hasAccessToSpace({ userId: req.session.user.id, spaceId });
        if (error) {
          throw new UnauthorisedActionError();
        }
        spaceIds[spaceId] = true;
      }
    })
  );

  const updatedBlocks = await prisma.$transaction(
    blocks.map((block) =>
      prisma.block.update({
        where: { id: block.id },
        data: {
          ...block,
          fields: block.fields as any,
          updatedAt: new Date(),
          updatedBy: req.session.user.id
        }
      })
    )
  );

  const mappedBoardPages = pages.reduce(
    (acc, page) => {
      if (page.type === 'board') {
        acc[page.id] = !!page.isLocked;
      }
      return acc;
    },
    {} as Record<string, boolean>
  );

  const blocksWithLocked = updatedBlocks.map((block) => {
    if (block.type === 'board') {
      (block as BlockWithDetails).isLocked = mappedBoardPages[block.id];
    }
    return block;
  });

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: updatedBlocks.map((block) => prismaToBlock(block))
    },
    updatedBlocks[0].spaceId
  );

  return res.status(200).json(blocksWithLocked as BlockWithDetails[]);
}

async function deleteBlocks(req: NextApiRequest, res: NextApiResponse) {
  const queryBlockIds = (req.query.blockIds ?? []) as string[];
  const blockIds = typeof queryBlockIds === 'string' ? [queryBlockIds] : queryBlockIds;
  const userId = req.session.user.id as string | undefined;

  const blocks = await prisma.block.findMany({
    where: {
      id: {
        in: blockIds
      }
    }
  });

  const spaceIds = [...new Set(blocks.map((p) => p.spaceId).filter(isTruthy))];

  // A user can delete only a batch of blocks from a single space
  if (spaceIds.length > 1) {
    throw new ActionNotPermittedError("You can't delete blocks from multiple spaces at once");
  }

  for (const blockId of blockIds) {
    const permissions = await permissionsApiClient.pages.computePagePermissions({
      resourceId: blockId,
      userId
    });

    if (permissions.delete !== true) {
      throw new ActionNotPermittedError('You are not allowed to delete this block.');
    } else if (permissions.delete === true) {
      break;
    }
  }

  await prisma.block.deleteMany({
    where: {
      id: {
        in: [...blocks.map((block) => block.id)]
      }
    }
  });

  log.info('User deleted blocks', { count: blocks.length, spaceId: spaceIds[0], userId });

  return res.status(200).end();
}

export default withSessionRoute(handler);
