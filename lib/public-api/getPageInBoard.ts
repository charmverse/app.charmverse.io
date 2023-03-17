import type { Block } from '@prisma/client';
import { validate } from 'uuid';

import { prisma } from 'db';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';
import { InvalidInputError } from 'lib/utilities/errors';
import { filterObjectKeys } from 'lib/utilities/objects';

import { DatabasePageNotFoundError, PageNotFoundError, SpaceNotFoundError } from './errors';
import type { DatabasePage, CardPage, PageProperty } from './interfaces';
import { PageFromBlock } from './pageFromBlock.class';

export async function getPageInBoard(pageId: string): Promise<CardPage> {
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

  const cardPage = await prisma.page.findUnique({
    where: {
      id: card.id
    }
  });

  if (!cardPage) {
    throw new PageNotFoundError(pageId);
  }

  const boardSchema = (board.fields as any).cardProperties as PageProperty[];

  const cardToReturn = new PageFromBlock(card, boardSchema);

  cardToReturn.content.markdown = await generateMarkdown({
    title: cardPage.title,
    content: cardPage.content
  });

  return cardToReturn;
}

/**
 * The root database page also containing the schema for that database
 * @param id The id or path of the database
 * @param spaceId If searching by database path, you must provide the spaceId to avoid conflicts
 */
export async function getDatabaseRoot(id: string, spaceId?: string): Promise<DatabasePage> {
  const isValidUuid = validate(id as string);

  if (!isValidUuid && !spaceId) {
    throw new InvalidInputError('Please provide a spaceID in order to search pages by path');
  }

  // eslint-disable-next-line prefer-const
  const database = await prisma.page.findFirst({
    where: isValidUuid
      ? {
          type: 'board',
          boardId: id as string,
          spaceId
        }
      : {
          type: 'board',
          path: id as string,
          spaceId
        }
  });

  if (!database) {
    throw new DatabasePageNotFoundError(id as string);
  }

  const board = (await prisma.block.findFirst({
    where: {
      type: 'board',
      id: database.boardId as string
    }
  })) as any as Block;

  if (!board) {
    throw new DatabasePageNotFoundError(id as string);
  }

  const filteredDatabaseObject = filterObjectKeys(database as any as DatabasePage, 'include', [
    'id',
    'createdAt',
    'updatedAt',
    'type',
    'title',
    'url',
    'spaceId',
    'schema'
  ]);

  const domain = process.env.DOMAIN;

  const space = await prisma.space.findUnique({ where: { id: board.spaceId } });

  // This should never be reached as blocks are deleted when a space is deleted
  // Added to avoid null coalescing assertions
  if (!space) {
    throw new SpaceNotFoundError(board.spaceId);
  }

  filteredDatabaseObject.url = `${domain}/${space.domain}/${database.path}`;

  (filteredDatabaseObject as any).schema = (board as any).fields.cardProperties;
  filteredDatabaseObject.id = board.id;

  return filteredDatabaseObject;
}
