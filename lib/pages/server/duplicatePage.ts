import type { Block, Page, Prisma, PrismaPromise } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createBlock } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import { createBoardView } from 'lib/focalboard/boardView';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import type { PageContent } from 'models';

import { getPage, PageNotFoundError } from '.';

export async function duplicatePage (pageId: string, userId: string, parentId?: string) {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const createdPageId = v4();

  const parentIdToAssign = parentId ?? page.parentId;

  const transactions: PrismaPromise<any>[] = [createPage({
    data: {
      id: createdPageId,
      parentId: parentIdToAssign,
      updatedBy: userId,
      title: `${page.title} (copy)`,
      content: page.content ?? undefined,
      contentText: page.contentText,
      headerImage: page.headerImage,
      icon: page.icon,
      snapshotProposalId: page.snapshotProposalId,
      type: page.type,
      author: {
        connect: {
          id: userId
        }
      },
      path: getPagePath(),
      space: {
        connect: {
          id: page.spaceId as string
        }
      },
      boardId: page.type === 'board' ? createdPageId : null
    } as Prisma.PageCreateInput
  })];

  // Create the board block, views and card blocks + pages
  if (page.type === 'board') {
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          {
            id: page.id
          },
          {
            parentId: page.id
          }
        ]
      }
    });

    // All view blocks store card order so they have to be created after we know all the new card block ids
    const viewBlocks: Block[] = [];
    // card block id, card block
    const cardBlocksRecord: Record<string, Block> = {};
    // Card page id, card page
    const cardPagesRecord: Record<string, Page> = {};
    let boardBlock: Block | null = null as any;
    const blockCreateManyInput: Prisma.BlockCreateManyInput[] = [];
    const pageCreateManyInput: Prisma.PageCreateManyInput[] = [];

    blocks.forEach(block => {
      if (block.type === 'board') {
        boardBlock = block;
      }
      else if (block.type === 'view') {
        viewBlocks.push(block);
      }
      else if (block.type === 'card') {
        cardBlocksRecord[block.id] = block;
      }
    });

    // Only proceed if the board block exist
    if (boardBlock) {
      const cardBlockIds = Object.keys(cardBlocksRecord);

      // Get all the pages corresponding to the cards
      const cardPages = cardBlockIds.length !== 0 ? await prisma.page.findMany({
        where: {
          id: {
            in: cardBlockIds
          },
          type: 'card'
        }
      }) : [];

      // Populate the card pages record
      cardPages.forEach(cardPage => {
        cardPagesRecord[cardPage.id] = cardPage;
      });

      blockCreateManyInput.push(
        {
          ...createBoard({
            fields: boardBlock.fields as Record<string, any>,
            id: createdPageId,
            parentId: boardBlock.parentId,
            rootId: createdPageId,
            schema: 1,
            spaceId: boardBlock.spaceId,
            title: `${boardBlock.title} (copy)`,
            type: 'board',
            createdBy: userId,
            updatedBy: userId
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null
        }
      );

      // Array to hold the new card block ids
      const duplicatedCardBlockIds: string[] = [];

      Object
        .values(cardBlocksRecord)
        .forEach(cardBlock => {
          const cardPage = cardPagesRecord[cardBlock.id];
          const duplicateCardId = v4();
          blockCreateManyInput.push(({
            ...createBlock({ ...cardBlock as any, type: 'card', fields: cardBlock.fields as Record<string, any>, id: duplicateCardId }),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            parentId: createdPageId,
            rootId: createdPageId,
            schema: 1,
            spaceId: cardBlock.spaceId,
            type: 'card'
          }));
          // Populate the card page inputs when populating the card block inputs
          pageCreateManyInput.push({
            id: duplicateCardId,
            parentId: createdPageId,
            createdBy: userId,
            updatedBy: userId,
            title: cardPage.title,
            content: cardPage.content ?? undefined,
            contentText: cardPage.contentText,
            headerImage: cardPage.headerImage,
            icon: cardPage.icon,
            snapshotProposalId: cardPage.snapshotProposalId,
            type: cardPage.type,
            spaceId: cardPage.spaceId,
            path: getPagePath()
          });
          duplicatedCardBlockIds.push(duplicateCardId);
        });
      blockCreateManyInput.push(...viewBlocks.map(viewBlock => ({
        ...createBoardView({
          fields: {
            ...viewBlock.fields as Record<string, any>,
            cardOrder: duplicatedCardBlockIds
          },
          parentId: createdPageId,
          rootId: createdPageId,
          schema: 1,
          spaceId: viewBlock.spaceId,
          title: viewBlock.title,
          type: 'view',
          createdBy: userId,
          updatedBy: userId,
          id: v4()
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      })));
    }

    transactions.push(prisma.block.createMany({
      data: blockCreateManyInput
    }));

    transactions.push(prisma.page.createMany({
      data: pageCreateManyInput
    }));
  }

  const [createdPage] = await prisma.$transaction(transactions);

  return setupPermissionsAfterPageCreated(createdPage.id);
}
