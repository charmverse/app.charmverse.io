import { prisma } from '@charmverse/core/prisma-client';
import { applyPageToBlock } from '@root/lib/databases/block';
import { isTruthy } from '@root/lib/utils/types';

import { prettyPrint } from '../utils/strings';

import type { BlockWithDetails } from './block';
import type { BoardFields } from './board';
import { getBlocks } from './proposalsSource/getBlocks';

type SourceType = 'proposals';

// get all the blocks of a tree, as well as any blocks from linked databases
export async function getRelatedBlocks(blockId: string): Promise<{ blocks: BlockWithDetails[]; source?: SourceType }> {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ id: blockId }, { rootId: blockId }]
    }
  });

  if (blockId.startsWith('9')) {
    console.log('DEBUG');
    prettyPrint({ blocks });
    console.log('DEBUG');
  }

  const boardBlocks = blocks.filter((b) => b.type === 'board');
  const connectedBoardIds = boardBlocks
    .map((boardBlock) =>
      (boardBlock.fields as unknown as BoardFields).cardProperties.map(
        (cardProperty) => cardProperty.type === 'relation' && cardProperty.relationData?.boardId
      )
    )
    .flat()
    .filter(isTruthy);

  if (blockId.startsWith('26')) {
    console.log('DEBUG');
    prettyPrint({ boardBlocks, connectedBoardIds });
    console.log('DEBUG');
  }

  const relationalBlocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          id: {
            in: connectedBoardIds
          }
        },
        {
          rootId: {
            in: connectedBoardIds
          }
        }
      ]
    }
  });

  blocks.push(...relationalBlocks);

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
      deletedAt: true,
      id: true,
      icon: true,
      title: true,
      bountyId: true,
      cardId: true,
      boardId: true,
      hasContent: true,
      galleryImage: true,
      headerImage: true,
      syncWithPageId: true,
      type: true,
      updatedAt: true,
      updatedBy: true,
      isLocked: true
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

  // const proposalBoardBlocks = blocks.filter(
  //   (b) => b.type === 'board' && (b.fields as any as BoardFields).sourceType === 'proposals'
  // );

  // const proposalBlockChildren = proposalBoardBlocks.length
  //   ? blocks.filter((b) => proposalBoardBlocks.some((pb) => pb.id === b.parentId))
  //   : [];

  // const mountedBlocks = await Promise.all(
  //   proposalBoardBlocks.map((b) => getBlocks(b as any, proposalBlockChildren.filter((c) => c.parentId === b.id) as any))
  // ).then((data) => data.flat());

  const validBlocks = blocks
    // .filter((block) => !proposalBlockChildren.some((b) => b.id === block.id))
    .map((block) => {
      const page = pagesMap[block.id];
      if (page) {
        return applyPageToBlock(block, page);
      }
      return block as BlockWithDetails;
    })
    // remove orphan and deleted blocks
    .filter((block) => !block.deletedAt && (!!block.pageId || block.type === 'view' || block.type === 'board'));

  return { blocks: [...validBlocks] as any, source };
}
