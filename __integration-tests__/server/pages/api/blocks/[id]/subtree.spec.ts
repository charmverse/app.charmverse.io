/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import type { Block, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsProposals } from '@charmverse/core/test';
import request from 'supertest';

import type { BlockWithDetails } from 'lib/databases/block';
import { createCardsFromProposals } from 'lib/databases/createCardsFromProposals';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBoard } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';

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

describe('GET /api/blocks/[id]/subtree', () => {
  it('Should get all board, view and cards blocks for a database if a user can access the database, responding 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${database.id}/subtree`).set('Cookie', adminCookie).expect(200)
    ).body as Block[];

    expect(databaseBlocks).toHaveLength(totalSourceBlocks);

    expect(databaseBlocks).toEqual(
      expect.arrayContaining(
        [database, ...databaseViews, ...databaseCards].map((block) => expect.objectContaining({ id: block.id }))
      )
    );
  });

  it('Should fail if the user cannot access the database, responding 404', async () => {
    const outsideUser = await testUtilsUser.generateUser();
    const outsideUserCookie = await loginUser(outsideUser.id);
    await request(baseUrl).get(`/api/blocks/${database.id}/subtree`).set('Cookie', outsideUserCookie).expect(404);
  });

  // This test uses public permissions to enable access to cards
  it('Should return only the pages a user can access', async () => {
    const sharedDatabase = await generateBoard({
      createdBy: adminUser.id,
      spaceId: space.id,
      views: sourceDatabaseViewsCount,
      cardCount: sourceDatabaseCardsCount,
      permissions: [
        {
          permissionLevel: 'full_access',
          public: true
        }
      ]
    });
    const outsideUser = await testUtilsUser.generateUser();
    const outsideUserCookie = await loginUser(outsideUser.id);
    const cards = await prisma.block.findMany({
      where: {
        rootId: sharedDatabase.id,
        type: 'card'
      }
    });

    // sanity check
    expect(cards).toHaveLength(sourceDatabaseCardsCount);

    // remove access to one of the cards
    await prisma.pagePermission.delete({
      where: {
        public_pageId: {
          pageId: cards[0].id,
          public: true
        }
      }
    });

    const databaseBlocks = (
      await request(baseUrl)
        .get(`/api/blocks/${sharedDatabase.id}/subtree`)
        .set('Cookie', outsideUserCookie)
        .expect(200)
    ).body as Block[];
    const cardBlocks = databaseBlocks.filter((b) => b.type === 'card');
    expect(cardBlocks).toHaveLength(cards.length - 1);
  });

  // This test uses public permissions to enable access to cards
  it('Should return only the cards from proposals that a user can access', async () => {
    // set up test user
    const reviewer = await testUtilsUser.generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: reviewer.id
    });

    // set up proposal-as-a-source db
    const sharedDatabase = await generateBoard({
      createdBy: adminUser.id,
      spaceId: space.id,
      viewDataSource: 'proposals',
      cardCount: 0,
      permissions: [
        {
          permissionLevel: 'full_access',
          userId: reviewer.id
        }
      ]
    });
    const visibleProposal = await testUtilsProposals.generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          permissions: [
            {
              assignee: {
                group: 'all_reviewers'
              },
              operation: 'view'
            }
          ],
          reviewers: [{ id: reviewer.id, group: 'user' }]
        }
      ]
    });
    // proposal is hidden
    await testUtilsProposals.generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          permissions: [],
          reviewers: []
        }
      ]
    });
    const sessionCookie = await loginUser(reviewer.id);
    await createCardsFromProposals({ boardId: sharedDatabase.id, spaceId: space.id, userId: adminUser.id });

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${sharedDatabase.id}/subtree`).set('Cookie', sessionCookie).expect(200)
    ).body as BlockWithDetails[];

    const cardBlocks = databaseBlocks.filter((b) => b.type === 'card');
    expect(cardBlocks.map((c) => c.syncWithPageId)).toEqual([visibleProposal.id]);
  });
});
