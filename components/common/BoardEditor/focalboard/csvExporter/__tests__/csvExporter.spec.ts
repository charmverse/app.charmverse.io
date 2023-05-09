import type { Block } from '@charmverse/core/prisma';
import { v4 as uuid } from 'uuid';

import { prismaToBlock } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { createBoardView } from 'lib/focalboard/boardView';
import { createCard } from 'lib/focalboard/card';
import { formatDate, formatDateTime } from 'lib/utilities/dates';

import { CsvExporter } from '../csvExporter';

import { generateFields, mockBoardBlock, mockCardBlock } from './mocks';

describe('CsvExporter', () => {
  test('should generate rows to help export easyar the csv', async () => {
    const spaceId = uuid();
    const userId = uuid();

    const boardId = uuid();
    const boardBlock = {
      ...mockBoardBlock,
      id: boardId,
      createdBy: userId,
      spaceId,
      rootId: boardId
    };
    const blockBoardFromPrismaToBlock = prismaToBlock(boardBlock);
    const board = createBoard({ block: blockBoardFromPrismaToBlock, addDefaultProperty: true });
    const cardPropertyOptions = board.fields.cardProperties[0].options;
    const optionId = board.fields.cardProperties[0].id;
    const firstPropertyId = cardPropertyOptions[0].id;
    const secondPropertyId = cardPropertyOptions[1].id;
    const thirdPropertyId = cardPropertyOptions[2].id;

    const englishTitle = 'My wonderful card #1';
    const chineseTitle = '日本';
    const japaneseTitle = 'こんにちは';

    const cardBlock1: Block = {
      ...mockCardBlock,
      id: uuid(),
      createdBy: userId,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
      schema: 1,
      spaceId,
      rootId: boardId,
      parentId: boardId,
      title: englishTitle,
      fields: {
        properties: {
          [optionId]: firstPropertyId as unknown as string
        }
      }
    };

    const cardBlock2: Block = {
      ...mockCardBlock,
      id: uuid(),
      createdBy: userId,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
      schema: 1,
      spaceId,
      rootId: boardId,
      parentId: boardId,
      title: chineseTitle,
      fields: {
        properties: {
          [optionId]: secondPropertyId as unknown as string
        }
      }
    };

    const cardBlock3: Block = {
      ...mockCardBlock,
      id: uuid(),
      createdBy: userId,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
      schema: 1,
      spaceId,
      rootId: boardId,
      parentId: boardId,
      title: japaneseTitle,
      fields: {
        properties: {
          [optionId]: ''
        }
      }
    };

    const cards = [cardBlock1, cardBlock2, cardBlock3].map((c) => prismaToBlock(c)).map((c) => createCard(c));
    const simpleBoardView = createBoardView();
    const viewFields = generateFields(
      [optionId],
      [firstPropertyId, secondPropertyId, thirdPropertyId],
      cards.map((c) => c.id)
    );
    const view: BoardView = {
      ...simpleBoardView,
      fields: viewFields
    };

    const rows = CsvExporter.exportTableCsv(board, view, cards, {
      date: (date) => formatDate(date),
      dateTime: (date) => formatDateTime(date)
    });

    const rowsDecoded = decodeURIComponent(rows);

    // Expect titles and only selected properties to be in the csv
    expect(rowsDecoded.includes(englishTitle)).toBeTruthy();
    expect(rowsDecoded.includes(japaneseTitle)).toBeTruthy();
    expect(rowsDecoded.includes(chineseTitle)).toBeTruthy();
    expect(rowsDecoded.includes(cardPropertyOptions[0].value)).toBeTruthy();
    expect(rowsDecoded.includes(cardPropertyOptions[1].value)).toBeTruthy();
    expect(rowsDecoded.includes(cardPropertyOptions[2].value)).toBeFalsy();
  });
});
