import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { generateBoard } from '@packages/testing/setupDatabase';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import { v4 as uuid } from 'uuid';

import type { DatabaseBlocksCount } from '../countDatabaseBlockContentAndProps';
import { countDatabaseBlockContentAndProps } from '../countDatabaseBlockContentAndProps';

describe('countDatabaseBlockContentAndProps', () => {
  const selectSchema = generateSchema({ type: 'select', options: ['Blue', 'Green', 'Red'] });
  const multiSelectSchema = generateSchema({ type: 'multiSelect', options: ['Blue', 'Green', 'Red'] });
  const numberSchema = generateSchema({ type: 'number' });
  const textSchema = generateSchema({ type: 'text' });
  const dateSchema = generateSchema({ type: 'date' });
  const checkboxSchema = generateSchema({ type: 'checkbox' });
  const urlSchema = generateSchema({ type: 'url' });

  const propertyTemplates = [
    selectSchema,
    multiSelectSchema,
    numberSchema,
    textSchema,
    dateSchema,
    checkboxSchema,
    urlSchema
  ];

  it('should count each database view and valid properties and values as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const board = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      cardCount: 2,
      views: 2,
      customProps: {
        cardPropertyValues: {
          [selectSchema.id]: 'Blue',
          [numberSchema.id]: 27,
          [multiSelectSchema.id]: []
        },
        propertyTemplates
      }
    });

    const count = await countDatabaseBlockContentAndProps({ spaceId: space.id });
    expect(count).toMatchObject<DatabaseBlocksCount>({
      total: 13,
      details: {
        databaseViews: 2,
        databaseDescriptions: 0,
        databaseProperties: 7,
        databaseRowPropValues: 4
      }
    });
  });

  it('should count only the properties and database descriptions for which there is a value, and ignore values without a corresponding property', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const board = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      cardCount: 2,
      views: 2,
      customProps: {
        cardPropertyValues: {
          [selectSchema.id]: 'Blue',
          [numberSchema.id]: 0,
          [urlSchema.id]: 'https://example.com',
          // Ignored because array is empty
          [multiSelectSchema.id]: [],
          // This property is not in the property templates, so it should not be counted
          [uuid()]: 'Ignored text'
        },
        propertyTemplates
      }
    });

    const secondDbId = uuid();

    const boardWithBlockDescription = await prisma.block.create({
      data: {
        id: secondDbId,
        rootId: secondDbId,
        parentId: secondDbId,
        schema: 1,
        type: 'board',
        spaceId: space.id,
        createdBy: user.id,
        title: '-',
        updatedBy: user.id,
        fields: {
          description: stubProsemirrorDoc({ text: 'Example text' })
        }
      }
    });

    const count = await countDatabaseBlockContentAndProps({ spaceId: space.id });
    expect(count).toMatchObject<DatabaseBlocksCount>({
      total: 16,
      details: {
        databaseViews: 2,
        databaseDescriptions: 1,
        databaseProperties: 7,
        // 2 cards with 3 non empty values each for which there is a schema
        databaseRowPropValues: 6
      }
    });
  });

  it('should ignore blocks that are marked as deleted', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const deletedBoard = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      cardCount: 2,
      views: 2,
      deletedAt: new Date(),
      customProps: {
        cardPropertyValues: {
          [selectSchema.id]: 'Blue',
          [numberSchema.id]: 27,
          [multiSelectSchema.id]: []
        },
        propertyTemplates
      }
    });

    const board = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      cardCount: 2,
      views: 2,
      customProps: {
        cardPropertyValues: {
          [selectSchema.id]: 'Blue',
          [numberSchema.id]: 27,
          [multiSelectSchema.id]: []
        },
        propertyTemplates
      }
    });

    const count = await countDatabaseBlockContentAndProps({ spaceId: space.id });
    expect(count).toMatchObject<DatabaseBlocksCount>({
      total: 13,
      details: {
        databaseViews: 2,
        databaseDescriptions: 0,
        databaseProperties: 7,
        databaseRowPropValues: 4
      }
    });
  });

  it('should return 0 when there are no databases, views, or cards', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    // Assuming that a new space has no databases, views, or cards
    const count = await countDatabaseBlockContentAndProps({ spaceId: space.id });
    expect(count).toMatchObject<DatabaseBlocksCount>({
      total: 0,
      details: {
        databaseViews: 0,
        databaseDescriptions: 0,
        databaseProperties: 0,
        databaseRowPropValues: 0
      }
    });
  });
});
