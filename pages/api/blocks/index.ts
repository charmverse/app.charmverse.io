import { copyAllPagePermissions } from '@charmverse/core/permissions';
import type { Block, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prismaToBlock } from 'lib/focalboard/block';
import type { BoardFields } from 'lib/focalboard/board';
import type { BoardViewFields } from 'lib/focalboard/boardView';
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
import { getPermissionsClient, permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { getCustomDomainFromHost } from 'lib/utilities/domains/getCustomDomainFromHost';
import { getSpaceDomainFromHost } from 'lib/utilities/domains/getSpaceDomainFromHost';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';
import { relay } from 'lib/websockets/relay';

export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createBlocks).put(updateBlocks).delete(deleteBlocks);

async function createBlocks(req: NextApiRequest, res: NextApiResponse<Omit<Block, ServerBlockFields>[]>) {
  const data = req.body as Omit<Block, ServerBlockFields>[];
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
        // Focalboard pre-emptively adds the card to the cardOrder prop. This prevents invalid property IDs building up in the cardOrder prop
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

  const newBlocks = data.map((block) => ({
    ...block,
    fields: block.fields,
    spaceId: space.id,
    createdBy: req.session.user.id,
    updatedBy: req.session.user.id,
    deletedAt: null
  }));

  const cardBlocks = newBlocks.filter((newBlock) => newBlock.type === 'card');

  const parentPageIds = cardBlocks.map((block) => block.parentId).filter((id) => Boolean(id));

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
        title: cardBlock.title,
        icon: cardFields.icon,
        type: cardFields.isTemplate ? 'card_template' : 'card',
        headerImage: cardFields.headerImage,
        contentText: cardFields.contentText || '',
        parentId: cardBlock.parentId,
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
      // @ts-ignore - cant fix type for json field "fields"
      data: newBlocks
    }),
    ...cardPageQueries
  ]);

  await Promise.all([
    (async () => {
      const blocksToNotify = await prisma.block.findMany({
        where: {
          id: {
            in: newBlocks.map((b) => b.id)
          }
        }
      });

      relay.broadcast(
        {
          type: 'blocks_created',
          payload: blocksToNotify.map((block) => prismaToBlock(block))
        },
        space.id
      );
    })(),
    (async () => {
      const createdPages = await getPageMetaList(newBlocks.map((b) => b.id));
      if (createdPages.length) {
        relay.broadcast(
          {
            type: 'pages_created',
            payload: createdPages
          },
          space.id
        );
      }
    })()
  ]);

  return res.status(201).json(newBlocks);
}

async function updateBlocks(req: NextApiRequest, res: NextApiResponse<Block[]>) {
  const blocks: Block[] = req.body;

  // validate access to the space
  await Promise.all(
    blocks.map(async (block) => {
      const spaceId = block.spaceId ?? (await prisma.block.findUnique({ where: { id: block.id } }))?.spaceId;
      const { error } = await hasAccessToSpace({ userId: req.session.user.id, spaceId });
      if (error) {
        throw new UnauthorisedActionError();
      }
    })
  );

  const updatedBlocks = await prisma.$transaction(
    blocks.map((block) => {
      return prisma.block.update({
        where: { id: block.id },
        data: {
          ...block,
          fields: block.fields as any,
          updatedAt: new Date(),
          updatedBy: req.session.user.id
        }
      });
    })
  );

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: updatedBlocks.map((block) => prismaToBlock(block))
    },
    updatedBlocks[0].spaceId
  );

  return res.status(200).json(updatedBlocks);
}

async function deleteBlocks(req: NextApiRequest, res: NextApiResponse<Block[]>) {
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

  return res.status(200).json(blocks);
}

export default withSessionRoute(handler);
