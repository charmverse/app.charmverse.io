import { prisma } from 'db';
import { Page, PageProperty } from './interfaces';
import { DatabasePageNotFoundError, PageNotFoundError } from './errors';
import { PageFromBlock } from './pageFromBlock.class';

export async function getPageInBoard (pageId: string): Promise<Page> {

  const card = await prisma.block.findFirst({
    where: {
      type: 'card',
      id: pageId as string
    }
  });

  if (!card) {
    throw new PageNotFoundError(pageId);
  }

  const board = await prisma.block.findFirst({
    where: {
      // Parameter only added for documentation purposes. All cards linked to a root board
      type: 'board',
      id: card.rootId
    }
  });

  if (!board) {
    throw new DatabasePageNotFoundError(card.rootId);
  }

  const cardPageContent = await prisma.block.findFirst({
    where: {
      type: 'charm_text',
      parentId: card.id
    }
  });

  const boardSchema = (board.fields as any).cardProperties as PageProperty[];

  const cardToReturn = new PageFromBlock(card, boardSchema, (cardPageContent?.fields as any)?.content);

  return cardToReturn;
}
