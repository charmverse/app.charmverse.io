import type { Block } from '@charmverse/core/prisma';
import { v4 as uuid } from 'uuid';

import type { Formatters, PropertyContext } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import { prismaToBlock } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { createBoardView } from 'lib/focalboard/boardView';
import { createCard } from 'lib/focalboard/card';
import { extractDatabaseProposalProperties } from 'lib/focalboard/extractDatabaseProposalProperties';
import { generateResyncedProposalEvaluationForCard } from 'lib/focalboard/generateResyncedProposalEvaluationForCard';
import { getBoardProperties } from 'lib/focalboard/setDatabaseProposalProperties';
import { formatDate, formatDateTime } from 'lib/utilities/dates';
import { createMockBoard, createMockCard } from 'testing/mocks/block';

import { CsvExporter, getCSVColumns } from '../csvExporter';

import { generateFields, mockBoardBlock, mockCardBlock } from './mocks';

const formatters: Formatters = {
  date: formatDate,
  dateTime: formatDateTime
};

const emptyContext: PropertyContext = {
  spaceDomain: 'test-space',
  users: {},
  proposalCategories: {}
};

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

    const rows = CsvExporter.exportTableCsv(board, view, cards, formatters, emptyContext);

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

describe('getCSVColumns()', () => {
  it('Handles number properties as string or number type', () => {
    const board = createMockBoard();
    board.fields.cardProperties = [
      {
        id: 'property_id_1',
        name: 'MockStatus',
        type: 'number',
        options: []
      },
      {
        id: 'property_id_2',
        name: 'MockStatus',
        type: 'number',
        options: []
      }
    ];
    const card = createMockCard(board);
    card.fields.properties.property_id_1 = '10';
    card.fields.properties.property_id_2 = 20;

    const rowColumns = getCSVColumns({
      card,
      context: emptyContext,
      formatters,
      hasTitleProperty: false,
      visibleProperties: board.fields.cardProperties
    });
    expect(rowColumns).toEqual(['"title"', '10', '20']);
  });

  it('Can export a card sourced from proposals', () => {
    const board = createMockBoard();
    board.fields.cardProperties = [];
    const boardProperties = getBoardProperties({
      boardBlock: board,
      proposalCategories: [{ id: 'category_id', title: 'MockCategory', color: 'red' }],
      spaceUsesRubrics: true
    });

    board.fields.cardProperties = boardProperties;
    const proposalStatusProperty = boardProperties.find((prop) => prop.type === 'proposalStatus');
    const reviewStatusOptionId = proposalStatusProperty?.options?.find((opt) => opt.value === 'review')?.id;
    const databaseProperties = extractDatabaseProposalProperties({
      boardBlock: board
    });
    const properties = {
      [databaseProperties.proposalCategory!.id]: 'category_id',
      [databaseProperties.proposalUrl!.id]: 'path-123',
      [databaseProperties.proposalStatus!.id]: reviewStatusOptionId,
      [databaseProperties.proposalEvaluatedBy!.id]: 'user_1'
    };
    const card = createMockCard(board);
    const criteria = {
      id: uuid()
    };
    const { fields } = generateResyncedProposalEvaluationForCard({
      proposalEvaluationType: 'rubric',
      cardProps: { fields: { properties } },
      databaseProperties,
      rubricCriteria: [criteria],
      rubricAnswers: [{ userId: 'user_1', rubricCriteriaId: criteria.id, response: { score: 10 }, comment: '' }]
    });

    Object.assign(card.fields, fields);

    const context: PropertyContext = {
      users: { user_1: { username: 'Mo' } },
      proposalCategories: { category_id: 'General' },
      spaceDomain: 'test-space'
    };
    const rowColumns = getCSVColumns({
      card,
      context,
      formatters,
      hasTitleProperty: false,
      visibleProperties: board.fields.cardProperties
    });
    expect(rowColumns).toEqual([
      '"title"',
      '"General"',
      '"In Review"',
      '"http://localhost/test-space/path-123"',
      'Mo',
      '10',
      '10'
    ]);
  });
});
