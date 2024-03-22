import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utils/types';

import type { BlockWithDetails } from './block';
import type { BoardFields } from './board';
import type { BoardViewFields } from './boardView';
import { buildBlockWithDetails } from './buildBlockWithDetails';

type SourceType = 'proposals';

// get all the blocks of a tree, as well as any blocks from linked databases
export async function getRelatedBlocks(blockId: string): Promise<{ blocks: BlockWithDetails[]; source?: SourceType }> {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ id: blockId }, { rootId: blockId }]
    }
  });

  const boardBlocks = blocks.filter((b) => b.type === 'board');
  const connectedBoardIds = boardBlocks
    .map((boardBlock) =>
      (boardBlock.fields as unknown as BoardFields).cardProperties.map(
        (cardProperty) => cardProperty.type === 'relation' && cardProperty.relationData?.boardId
      )
    )
    .flat()
    .filter(isTruthy);

  const connectedBoards = await prisma.block.findMany({
    where: {
      id: {
        in: connectedBoardIds
      }
    }
  });

  blocks.push(...connectedBoards);

  const viewsWithLinkedSource = blocks.filter((b) => b.type === 'view' && (b.fields as BoardViewFields).linkedSourceId);

  if (viewsWithLinkedSource.length > 0) {
    const sourceDatabaseIds = viewsWithLinkedSource.map((b) => (b.fields as BoardViewFields).linkedSourceId as string);

    const linkedDatabaseBlocks = await prisma.block.findMany({
      where: {
        OR: [
          {
            id: {
              in: sourceDatabaseIds
            }
          },
          {
            rootId: {
              in: sourceDatabaseIds
            }
          },
          {
            parentId: {
              in: sourceDatabaseIds
            }
          }
        ]
      }
    });

    blocks.push(...linkedDatabaseBlocks);
  }

  const pages = await prisma.page.findMany({
    where: {
      OR: [
        {
          cardId: {
            in: blocks.map((b) => b.id)
          }
        },
        {
          boardId: {
            in: blocks.map((b) => b.id)
          }
        }
      ]
    },
    select: {
      id: true,
      icon: true,
      title: true,
      bountyId: true,
      cardId: true,
      boardId: true,
      hasContent: true,
      galleryImage: true,
      headerImage: true,
      type: true,
      updatedAt: true,
      updatedBy: true
    }
  });

  let source: SourceType | undefined;

  const pagesMap = pages.reduce<Record<string, (typeof pages)[number]>>((acc, page) => {
    const id = page.cardId || page.boardId;
    if (id) {
      acc[id] = page;
    }
    return acc;
  }, {});

  const validBlocks = blocks
    .map((block) => {
      const page = pagesMap[block.id];
      if (page) {
        return buildBlockWithDetails(block, page);
      }
      return block as BlockWithDetails;
    })
    // remove orphan blocks
    .filter((block) => !!block.pageId || block.type === 'view' || block.type === 'board');

  return { blocks: validBlocks, source };
}
