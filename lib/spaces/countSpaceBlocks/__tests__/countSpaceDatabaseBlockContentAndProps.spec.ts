import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { generateSchema } from 'testing/publicApi/schemas';
import { generateBoard } from 'testing/setupDatabase';
import { stubProsemirrorDoc } from 'testing/stubs/pageContent';

import type { DatabaseBlocksCount } from '../countSpaceDatabaseBlockContentAndProps';
import { countSpaceDatabaseBlockContentAndProps } from '../countSpaceDatabaseBlockContentAndProps';

describe('countSpaceDatabaseBlockContentAndProps', () => {
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

  it('should count each database view, comment and valid properties and values as 1 block', async () => {
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

    const count = await countSpaceDatabaseBlockContentAndProps({ spaceId: space.id });
    expect(count).toMatchObject<DatabaseBlocksCount>({
      total: 13,
      details: {
        // 2 cards + 2 views + 1 database
        databaseViews: 2,
        databaseDescriptions: 0,
        databaseProperties: 7,
        // 2 cards with 1 value each
        databaseRowPropValues: 4
      }
    });
  });

  it('should count only the properties for which there is a value, and ignore values without a corresponding property', async () => {
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

    const count = await countSpaceDatabaseBlockContentAndProps({ spaceId: space.id });
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

  it('should return 0 when there are no databases, views, or cards', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    // Assuming that a new space has no databases, views, or cards
    const count = await countSpaceDatabaseBlockContentAndProps({ spaceId: space.id });
    expect(count.total).toBe(0);
  });
});
