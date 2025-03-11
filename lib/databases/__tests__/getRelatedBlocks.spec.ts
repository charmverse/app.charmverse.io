import type { Space } from '@charmverse/core/prisma';
import type { Block, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBoard } from '@packages/testing/setupDatabase';

import { getRelatedBlocks } from '../getRelatedBlocks';

let space: Space;

let adminUser: User;

let database: Block;
let databaseCards: Block[];
let databaseViews: Block[];

const sourceDatabaseViewsCount = 3;
const sourceDatabaseCardsCount = 5;

// 1 refers to the database definition block
const totalSourceBlocks = 1 + sourceDatabaseCardsCount + sourceDatabaseViewsCount;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  space = generated.space;
  adminUser = generated.user;

  const generatedDatabase = await generateBoard({
    createdBy: adminUser.id,
    spaceId: space.id,
    views: sourceDatabaseViewsCount,
    cardCount: sourceDatabaseCardsCount
  });

  const generatedDatabaseBlocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          id: generatedDatabase.id
        },
        {
          rootId: generatedDatabase.id
        }
      ]
    }
  });

  database = generatedDatabaseBlocks.find((b) => b.id === generatedDatabase.id) as Block;

  databaseCards = generatedDatabaseBlocks.filter((b) => b.type === 'card');

  databaseViews = generatedDatabaseBlocks.filter((b) => b.type === 'view');

  expect(database).toBeDefined();
  expect(databaseCards.length).toEqual(sourceDatabaseCardsCount);
  expect(databaseViews.length).toBe(sourceDatabaseViewsCount);
});

describe('getRelatedBlocks', () => {
  it('Should return the correct fields', async () => {
    const { blocks } = await getRelatedBlocks(database.id);

    const dbBlock = blocks.find((b) => b.id === database.id);

    expect(dbBlock).toEqual(
      expect.objectContaining({
        ...database,
        deletedAt: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    );
  });

  it('Should get all board, view and cards blocks for a database', async () => {
    const { blocks } = await getRelatedBlocks(database.id);

    expect(blocks).toHaveLength(totalSourceBlocks);

    expect(blocks).toEqual(
      expect.arrayContaining(
        [database, ...databaseViews, ...databaseCards].map((block) => expect.objectContaining({ id: block.id }))
      )
    );
  });
});
