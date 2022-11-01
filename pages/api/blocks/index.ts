
import type { Block, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { InvalidStateError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { createPage } from 'lib/pages/server/createPage';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { getPagePath } from 'lib/pages/utils';
import { copyAllPagePermissions } from 'lib/permissions/pages/actions/copyPermission';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBlocks).post(createBlocks).put(updateBlocks);

async function getBlocks (req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {

  const referer = req.headers.referer as string;
  const url = new URL(referer);

  url.hash = '';
  url.search = '';
  const pathnameParts = referer ? url.pathname.split('/') : [];
  const spaceDomain = pathnameParts[1];
  if (!spaceDomain) {
    throw new InvalidStateError('invalid referrer url');
  }
  // publicly shared focalboard
  if (spaceDomain === 'share') {
    const pageId = pathnameParts[2];
    if (!pageId) {
      throw new InvalidStateError('invalid referrer url');
    }
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      throw new NotFoundError('page not found');
    }
    const blocks = page.boardId ? await prisma.block.findMany({ where: { rootId: page.boardId } }) : [];
    return res.status(200).json(blocks);
  }

  else {
    let spaceId = req.query.spaceId as string | undefined;

    // TODO: Once all clients are updated to pass in spaceId, we should remove this way of looking up the space id
    if (!spaceId) {
      const space = await prisma.space.findUnique({
        where: {
          domain: spaceDomain
        }
      });
      spaceId = space?.id;
    }

    if (!spaceId) {
      throw new NotFoundError('workspace not found');
    }

    const blocks = await prisma.block.findMany({
      where: {
        spaceId,
        id: req.query.id
          ? req.query.id as string
          : req.query.ids
            ? {
              in: req.query.ids as string[]
            }
            : undefined }
    });
    return res.status(200).json(blocks);
  }
}

async function createBlocks (req: NextApiRequest, res: NextApiResponse<Block[]>) {
  const data = req.body as Omit<Block, ServerBlockFields>[];
  const referer = req.headers.referer as string;
  const url = new URL(referer);
  url.hash = '';
  url.search = '';
  const spaceDomain = referer ? url.pathname.split('/')[1] : null;

  if (spaceDomain) {
    const space = await prisma.space.findUnique({
      where: {
        domain: spaceDomain
      }
    });
    if (space) {
      const newBlocks = data.map(block => ({
        ...block,
        fields: block.fields as any,
        spaceId: space.id,
        createdBy: req.session.user.id,
        updatedBy: req.session.user.id,
        deletedAt: null
      }));
      const cardBlocks = newBlocks.filter(newBlock => newBlock.type === 'card');

      const parentBoardIds = cardBlocks.map(block => block.parentId).filter(id => Boolean(id));

      const parentPages = await prisma.page.findMany({
        where: {
          id: {
            in: parentBoardIds
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

      const cardPages: (Prisma.PageCreateInput | null)[] = cardBlocks.map(cardBlock => {

        const parentBoard = parentPages.find(p => p.id === cardBlock.parentId);

        if (!parentBoard) {
          return null;
        }

        // Since we are certain the card is leaf node, we can instantiate permissions directly here without the need for complex checks
        const initialPermissions = copyAllPagePermissions({
          permissions: parentBoard.permissions, inheritFrom: true, newPageId: cardBlock.id });

        initialPermissions.data = (initialPermissions.data as any[]).map(permission => {

          delete permission.pageId;

          return {
            ...permission
          };
        });

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
          icon: cardBlock.fields.icon,
          type: cardBlock.fields.isTemplate ? 'card_template' : 'card',
          headerImage: cardBlock.fields.headerImage,
          contentText: cardBlock.fields.contentText || '',
          parentId: cardBlock.parentId,
          updatedAt: cardBlock.updatedAt,
          content: cardBlock.fields.content ?? undefined,
          permissions: {
            createMany: initialPermissions
          }
        };
        delete cardBlock.fields.content;
        delete cardBlock.fields.contentText;
        delete cardBlock.fields.headerImage;
        delete cardBlock.fields.icon;
        return cardPage;
      });
      await prisma.block.createMany({
        data: newBlocks
      });

      for (const cardPage of cardPages) {
        if (cardPage) {
          await createPage({
            data: cardPage
          });
        }
      }

      const blocksToNotify = await prisma.block.findMany({ where: {
        id: {
          in: newBlocks.map(b => b.id)
        }
      } });

      relay.broadcast({
        type: 'blocks_created',
        payload: blocksToNotify
      }, space.id);

      const createdPages = await getPageMetaList(newBlocks.map(b => b.id));

      relay.broadcast({
        type: 'pages_created',
        payload: createdPages
      }, space.id);

      return res.status(200).json(newBlocks);
    }
  }

  // @ts-ignore - JsonValue is not compatible with InputJsonValue :(
  // const blocks = await prisma.block.createMany({ data });
  // console.log('blocks', blocks);
  return res.status(200).json(data);
}

async function updateBlocks (req: NextApiRequest, res: NextApiResponse<Block[]>) {
  const blocks: Block[] = req.body;

  const blockOps = blocks.map(block => {
    return prisma.block.update({
      where: { id: block.id },
      data: {
        ...block,
        fields: block.fields as any,
        updatedAt: new Date(),
        updatedBy: req.session.user.id
      }
    });
  });

  const updatedBlocks = await prisma.$transaction(blockOps);

  // We expect blocks to only be updated in a single space, but some future-proofing doesn't hurt
  const bySpaceId = blocks.reduce((acc, block, index) => {

    const spaceId = updatedBlocks[index].spaceId;

    if (!acc[spaceId]) {
      acc[spaceId] = [];
    }

    acc[spaceId].push(block);

    return acc;

  }, {} as Record<string, Block[]>);

  Object.entries(bySpaceId).forEach(([spaceId, blockList]) => {
    relay.broadcast({
      type: 'blocks_updated',
      payload: blockList
    }, spaceId);
  });

  return res.status(200).json(updatedBlocks);
}

export default withSessionRoute(handler);
