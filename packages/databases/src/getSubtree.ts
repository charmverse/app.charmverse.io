import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';
import { isTruthy } from '@packages/utils/types';

import { permissionsApiClient } from '@packages/lib/permissions/api/client';

import type { BlockWithDetails } from './block';
import type { Board, BoardFields } from './board';
import type { BoardView } from './boardView';
import type { Card } from './card';
import { filterLockedDatabaseCards } from './filterLockedDatabaseCards';
import { getRelatedBlocks } from './getRelatedBlocks';
import { getBlocksAndRefresh } from './proposalsSource/getBlocks';

export async function getSubtree({ pageId, userId }: { pageId: string; userId?: string }) {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      id: pageId
    },
    select: {
      boardId: true,
      cardId: true,
      spaceId: true,
      isLocked: true
    }
  });

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (computed.read !== true) {
    throw new DataNotFoundError('Page not found');
  }

  const blockId = page.boardId || page.cardId;
  if (!blockId) {
    throw new DataNotFoundError('Block not found');
  }

  const { blocks } = await getRelatedBlocks(blockId);
  const block = blocks.find((b) => b.id === blockId);

  if (block?.type === 'board') {
    (block as any as Board).isLocked = !!page.isLocked;
  }
  // Hydrate and filter blocks based on proposal permissions
  if (block && (block.fields as BoardFields).sourceType === 'proposals') {
    let result = await getBlocksAndRefresh(block, blocks);

    // Only edit
    if (((page.isLocked && !computed.edit_lock) || !computed.edit_content) && block?.type === 'board' && block) {
      const views = result.filter((b) => b.type === 'view');
      const cards = result.filter((b) => b.type === 'card');
      const filteredCards = filterLockedDatabaseCards({
        board: block as any as Board,
        views: views as any as BoardView[],
        cards: cards as any as Card[]
      });

      result = [block, ...(views as any as BlockWithDetails[]), ...(filteredCards as any as BlockWithDetails[])];
    }

    return result;
  } else {
    // INCOMPLETE CODE
    const proposalBoardBlocks = blocks.filter(
      (b) => b.type === 'board' && (b.fields as BoardFields).sourceType === 'proposals'
    );

    // Keep track of all proposal blocks for later filtering
    const proposalBlocksMap: Record<string, BlockWithDetails> = proposalBoardBlocks.reduce(
      (acc, board) => {
        acc[board.id] = board;
        return acc;
      },
      {} as Record<string, BlockWithDetails>
    );

    // Prepare blocks for processing
    const blocksGroupedByBoard = proposalBoardBlocks.reduce(
      (acc, board) => {
        acc[board.id] = {
          board,
          cards: []
        };
        return acc;
      },
      {} as Record<string, { board: BlockWithDetails; cards: BlockWithDetails[] }>
    );

    if (proposalBoardBlocks.length) {
      blocks.forEach((_block) => {
        const parentId = _block.parentId;
        if (parentId && _block.type === 'card' && blocksGroupedByBoard[parentId]) {
          blocksGroupedByBoard[parentId].cards.push(_block);
          proposalBlocksMap[_block.id] = _block;
        }
      });
    }

    const refreshedBlocks: BlockWithDetails[] = [];

    for (const proposalBoard of proposalBoardBlocks) {
      const refreshedWithProposalProps = await getBlocksAndRefresh(
        proposalBoard,
        blocksGroupedByBoard[proposalBoard.id].cards
      );

      refreshedBlocks.push(proposalBoard, ...refreshedWithProposalProps);
    }

    const permissionsById = await permissionsApiClient.pages.bulkComputePagePermissions({
      pageIds: blocks.map((b) => b.pageId).filter(isTruthy),
      userId
    });

    // Remember to allow normal blocks that do not have a page, like views, to be shown
    let filtered = blocks.filter(
      (b) => !proposalBlocksMap[b.id] && (typeof b.pageId === 'undefined' || !!permissionsById[b.pageId]?.read)
    );
    const cardsWithProposalProps = [...filtered, ...refreshedBlocks];

    // Only edit
    if (page.isLocked && block?.type === 'board' && !computed.edit_lock && block) {
      const views = filtered.filter((b) => b.type === 'view');
      const filteredCards = filterLockedDatabaseCards({
        board: block as any as Board,
        views: views as any as BoardView[],
        cards: cardsWithProposalProps as any as Card[]
      });

      filtered = [block, ...(views as any as BlockWithDetails[]), ...(filteredCards as any as BlockWithDetails[])];
    }

    return filtered;
  }
}
