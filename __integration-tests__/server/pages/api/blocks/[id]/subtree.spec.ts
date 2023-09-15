/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import type { Block, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBoard } from 'testing/setupDatabase';

let space: Space;

let outsideUser: User;

let adminUser: User;

let database: Block;
let databaseCards: Block[];
let databaseViews: Block[];

const sourceDatabaseViewsCount = 3;
const sourceDatabaseCardsCount = 5;

// 1 refers to the database definition block
const totalSourceBlocks = 1 + sourceDatabaseCardsCount + sourceDatabaseViewsCount;

let linkedDatabase: Block;
let linkedDatabaseViews: Block[];
const linkedDatabaseViewsCount = 1;

// 1 refers to the database definition block
const totalLinkedBlocks = 1 + linkedDatabaseViewsCount;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  space = generated.space;
  adminUser = generated.user;

  outsideUser = await testUtilsUser.generateUser();

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

  // Setup linked DB
  const generatedLinkedDatabase = await generateBoard({
    createdBy: adminUser.id,
    spaceId: space.id,
    views: linkedDatabaseViewsCount,
    cardCount: 0
  });

  const generatedLinkedDatabaseBlocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          id: generatedLinkedDatabase.id
        },
        {
          rootId: generatedLinkedDatabase.id
        }
      ]
    }
  });

  expect(generatedLinkedDatabaseBlocks).toHaveLength(2);

  linkedDatabase = generatedLinkedDatabaseBlocks.find((b) => b.id === generatedLinkedDatabase.id) as Block;
  expect(linkedDatabase).toBeDefined();

  const linkedView = generatedLinkedDatabaseBlocks.find((b) => b.type === 'view') as Block;
  const updatedLinkedView = await prisma.block.update({
    where: {
      id: linkedView.id
    },
    data: {
      fields: {
        ...(linkedView.fields as any),
        linkedSourceId: generatedDatabase.id
      }
    }
  });

  linkedDatabaseViews = [updatedLinkedView];
});

describe('GET /api/blocks/[id]/subtree', () => {
  it('Should get all board, view and cards blocks for a database if a user can access the database, responding 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${database.id}/subtree`).set('Cookie', adminCookie).expect(200)
    ).body as Block[];

    expect(databaseBlocks).toHaveLength(totalSourceBlocks);

    expect(databaseBlocks).toEqual(
      expect.arrayContaining(
        [database, ...databaseViews, ...databaseCards].map((block) =>
          expect.objectContaining({ ...block, createdAt: expect.any(String), updatedAt: expect.any(String) })
        )
      )
    );
  });

  it('Should get all board, view and cards blocks for a database and all blocks for any linked inline databases if a user can access the database, responding 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const foundLinkedDatabaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${linkedDatabase.id}/subtree`).set('Cookie', adminCookie).expect(200)
    ).body as Block[];

    expect(foundLinkedDatabaseBlocks).toHaveLength(totalSourceBlocks + totalLinkedBlocks);

    expect(foundLinkedDatabaseBlocks).toEqual(
      expect.arrayContaining(
        [database, ...databaseViews, ...databaseCards, linkedDatabase, ...linkedDatabaseViews].map((block) =>
          expect.objectContaining({ ...block, createdAt: expect.any(String), updatedAt: expect.any(String) })
        )
      )
    );
  });

  it('Should fail if the user cannot access the database, responding 404', async () => {
    const outsideUserCookie = await loginUser(outsideUser.id);
    await request(baseUrl).get(`/api/blocks/${database.id}/subtree`).set('Cookie', outsideUserCookie).expect(404);
  });
});
