import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { BlockWithDetails } from '@packages/databases/block';
import { applyPageToBlock } from '@packages/databases/block';
import type { BoardFields } from '@packages/databases/board';
import { getPageByBlockId } from '@packages/databases/getPageByBlockId';
import { applyPropertiesToCard } from '@packages/databases/proposalsSource/applyPropertiesToCards';
import { getCardPropertiesFromProposal } from '@packages/databases/proposalsSource/getCardProperties';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError, ApiError } from '@packages/nextjs/errors';
import { trashOrDeletePage } from '@packages/pages/trashOrDeletePage';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBlock).delete(deleteBlock);

async function getBlock(req: NextApiRequest, res: NextApiResponse<BlockWithDetails>) {
  const blockId = req.query.id as string;

  const block = await prisma.block.findUniqueOrThrow({
    where: {
      id: blockId
    }
  });

  const permissionsBlockId = block.type === 'view' ? block.rootId : block.id;

  const [page, permissionsPage] = await Promise.all([
    getPageByBlockId(block.id),
    getPageByBlockId(permissionsBlockId, { id: true })
  ]);

  if (!permissionsPage) {
    throw new DataNotFoundError(`Page not found for permissions: ${permissionsBlockId}`);
  }

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: permissionsPage.id,
    userId: req.session.user?.id
  });

  if (!permissions.read) {
    throw new DataNotFoundError('Block not found');
  }

  const result = page ? applyPageToBlock(block, page) : (block as BlockWithDetails);

  // apply readonly properties from source page (eg. proposal)
  if (page?.syncWithPageId) {
    const proposalPermission = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: page.syncWithPageId,
      userId: page.createdBy
    });
    const space = await prisma.space.findFirstOrThrow({
      where: {
        id: result.spaceId
      },
      select: {
        id: true,
        features: true,
        credentialTemplates: true,
        useOnchainCredentials: true
      }
    });
    const { boardBlock, card: proposalCardProps } = await getCardPropertiesFromProposal({
      boardId: block.rootId,
      pageId: page.syncWithPageId,
      space
    });
    const updatedFields = applyPropertiesToCard({
      boardProperties: (boardBlock.fields as any as BoardFields).cardProperties,
      block: result,
      proposalProperties: proposalCardProps,
      canViewPrivateFields: proposalPermission.view_private_fields
    });
    Object.assign(result, updatedFields);
  }

  return res.status(200).json(result);
}

async function deleteBlock(
  req: NextApiRequest,
  res: NextApiResponse<{ deletedCount: number; rootBlock: BlockWithDetails } | { error: string }>
) {
  const blockId = req.query.id as string;
  const userId = req.session.user.id as string;

  let deletedCount = 0;

  const rootBlock = await prisma.block.findUnique({
    where: {
      id: blockId
    }
  });

  if (!rootBlock) {
    throw new ApiError({
      message: 'Block not found',
      errorType: 'Data not found'
    });
  }

  const spaceId = rootBlock.spaceId;

  const isPageBlock = rootBlock.type === 'card' || rootBlock.type === 'card_template' || rootBlock.type === 'board';

  const pageId = isPageBlock ? rootBlock.id : rootBlock.rootId;

  const permissionsSet = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (rootBlock.type === 'card' || rootBlock.type === 'card_template' || rootBlock.type === 'board') {
    if (!permissionsSet.delete) {
      throw new ActionNotPermittedError();
    }

    const deletedChildPageIds = await trashOrDeletePage(blockId, userId, 'trash');
    deletedCount = deletedChildPageIds.length;
    relay.broadcast(
      {
        type: 'blocks_deleted',
        payload: deletedChildPageIds.map((id) => ({ id, type: 'card' }))
      },
      spaceId
    );

    relay.broadcast(
      {
        type: 'pages_deleted',
        payload: deletedChildPageIds.map((id) => ({ id }))
      },
      spaceId
    );

    log.info('User deleted a page block', {
      userId,
      pageId: blockId,
      pageIds: deletedChildPageIds,
      spaceId: rootBlock.spaceId
    });
  } else if (rootBlock.type === 'view') {
    if (!permissionsSet.edit_content) {
      throw new ActionNotPermittedError();
    }

    const viewsCount = await prisma.block.count({
      where: {
        type: 'view',
        parentId: rootBlock.parentId
      }
    });

    if (viewsCount === 1) {
      throw new ApiError({
        message: "Last view of a board page can't be deleted",
        errorType: 'Undesirable operation'
      });
    }

    await prisma.block.delete({
      where: {
        id: blockId
      }
    });
    deletedCount = 1;

    relay.broadcast(
      {
        type: 'blocks_deleted',
        payload: [{ id: blockId }]
      },
      spaceId
    );
  } else {
    if (!permissionsSet.edit_content) {
      throw new ActionNotPermittedError();
    }

    await prisma.block.delete({
      where: {
        id: blockId
      }
    });
    deletedCount = 1;

    relay.broadcast(
      {
        type: 'blocks_deleted',
        payload: [{ id: blockId }]
      },
      spaceId
    );
  }

  return res.status(200).json({ deletedCount, rootBlock: rootBlock as BlockWithDetails });
}

export default withSessionRoute(handler);
