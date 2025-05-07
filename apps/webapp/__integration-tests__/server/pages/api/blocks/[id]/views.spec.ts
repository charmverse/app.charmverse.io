/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import type { Block, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBoard } from '@packages/testing/setupDatabase';
import request from 'supertest';

let space: Space;

let outsideUser: User;

let adminUser: User;

let database: Block;
let databaseViews: Block[];

const sourceDatabaseViewsCount = 3;

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
    cardCount: 10
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

  databaseViews = generatedDatabaseBlocks.filter((b) => b.type === 'view');

  expect(database).toBeDefined();
  expect(databaseViews.length).toBe(sourceDatabaseViewsCount);
});

describe('GET /api/blocks/[id]/views', () => {
  it('Should get views for a database if a user can access the database, responding 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const viewBlocks = (
      await request(baseUrl).get(`/api/blocks/${database.id}/views`).set('Cookie', adminCookie).expect(200)
    ).body as Block[];

    expect(viewBlocks).toHaveLength(sourceDatabaseViewsCount);

    expect(viewBlocks).toEqual(
      expect.arrayContaining(
        databaseViews.map((view) =>
          expect.objectContaining({ ...view, createdAt: expect.any(String), updatedAt: expect.any(String) })
        )
      )
    );
  });
  it('Should fail if the user cannot access the database, responding 404', async () => {
    const outsideUserCookie = await loginUser(outsideUser.id);
    await request(baseUrl).get(`/api/blocks/${database.id}/views`).set('Cookie', outsideUserCookie).expect(404);
  });
});
