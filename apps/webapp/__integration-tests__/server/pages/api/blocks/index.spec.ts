import type { Block, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import type { BlockWithDetails } from '@packages/databases/block';
import type { Card } from '@packages/databases/card';
import type { ServerBlockFields } from '@packages/databases/utils/blockUtils';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBoard, generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

describe('POST /api/blocks', () => {
  let adminUser: User;
  let adminUserSpace: Space;
  let adminCookie: string;

  beforeAll(async () => {
    const { user, space } = await generateUserAndSpace();

    adminUser = user;
    adminUserSpace = space;
    adminCookie = await loginUser(adminUser.id);
  });

  it('should create a card in a board', async () => {
    const board = await generateBoard({
      createdBy: adminUser.id,
      spaceId: adminUserSpace.id,
      views: 1,
      boardPageType: 'board'
    });

    const input: Omit<BlockWithDetails, ServerBlockFields> = {
      createdAt: new Date(),
      deletedAt: null,
      fields: {},
      id: uuid(),
      parentId: board.id,
      rootId: board.id,
      title: 'Example',
      type: 'card',
      updatedAt: new Date()
    };

    const createdBlocks = (
      await request(baseUrl)
        .post(`/api/blocks`)
        .set('Cookie', adminCookie)
        .set('referer', `http://localhost:3000/${adminUserSpace.domain}`)
        .send([input])
        .expect(201)
    ).body as BlockWithDetails[];

    expect(createdBlocks.length).toBe(1);
    expect(createdBlocks[0]).toMatchObject({
      ...input,
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });
  it('should throw an error if the parent board is a board or inline board and the datasource is proposals', async () => {
    const board = await generateBoard({
      createdBy: adminUser.id,
      spaceId: adminUserSpace.id,
      views: 1,
      viewDataSource: 'proposals',
      boardPageType: 'board'
    });

    const input: Omit<BlockWithDetails, ServerBlockFields> = {
      createdAt: new Date(),
      deletedAt: null,
      fields: {},
      id: uuid(),
      parentId: board.id,
      rootId: board.id,
      title: 'Example',
      type: 'card',
      updatedAt: new Date()
    };

    await request(baseUrl)
      .post(`/api/blocks`)
      .set('Cookie', adminCookie)
      .set('referer', `http://localhost:3000/${adminUserSpace.domain}`)
      .send([input])
      .expect(400);
  });
});

describe('PUT /api/blocks/[id]', () => {
  let space: Space;

  let member: User;

  let adminUser: User;

  let database: Block;
  let databaseCards: Block[];
  let databaseViews: Block[];

  const sourceDatabaseViewsCount = 3;
  const sourceDatabaseCardsCount = 5;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    space = generated.space;
    adminUser = generated.user;

    member = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

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

  it('Should update blocks, responding 200', async () => {
    const db = await generateBoard({
      createdBy: adminUser.id,
      spaceId: space.id,
      views: 1,
      cardCount: 1
    });

    const card = (await prisma.block.findFirstOrThrow({
      where: {
        rootId: db.id,
        type: 'card'
      }
    })) as any as Card;

    const newProps = {
      newProp: 'propValue'
    };

    const cardUpdate = {
      ...card,
      fields: newProps
    };

    const adminCookie = await loginUser(adminUser.id);

    const cardBlock = (
      await request(baseUrl).put(`/api/blocks`).set('Cookie', adminCookie).send([cardUpdate]).expect(200)
    ).body as Block;

    expect(cardBlock).toMatchObject([
      expect.objectContaining({
        ...cardUpdate,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    ]);
  });

  it('Should fail if the user does not have permission to update some blocks, responding 200', async () => {
    const db = await generateBoard({
      createdBy: adminUser.id,
      spaceId: space.id,
      views: 1,
      cardCount: 2,
      permissions: [{ permissionLevel: 'full_access', spaceId: space.id }]
    });

    const [cardWithPermissions, cardWithoutPermissions] = (await prisma.block.findMany({
      where: {
        rootId: db.id,
        type: 'card'
      }
    })) as any as Card[];

    await prisma.pagePermission.deleteMany({
      where: {
        pageId: cardWithoutPermissions.id
      }
    });

    expect(cardWithPermissions).toBeDefined();
    expect(cardWithoutPermissions).toBeDefined();

    const board = (await prisma.block.findFirstOrThrow({
      where: {
        rootId: db.id,
        type: 'board'
      }
    })) as any as Card;

    const view = (await prisma.block.findFirstOrThrow({
      where: {
        rootId: db.id,
        type: 'view'
      }
    })) as any as Card;

    const newProps = {
      newProp: 'propValue'
    };

    const boardUpdate = {
      ...view,
      fields: newProps
    };

    const viewUpdate = {
      ...view,
      fields: newProps
    };

    const cardWithPermissionsUpdate = {
      ...cardWithPermissions,
      fields: newProps
    };

    const cardWithoutPermissionsUpdate = {
      ...cardWithoutPermissions,
      fields: newProps
    };

    const memberCookie = await loginUser(member.id);

    await request(baseUrl).put(`/api/blocks`).set('Cookie', memberCookie).send([viewUpdate]).expect(200);
    await request(baseUrl).put(`/api/blocks`).set('Cookie', memberCookie).send([boardUpdate]).expect(200);
    await request(baseUrl).put(`/api/blocks`).set('Cookie', memberCookie).send([cardWithPermissionsUpdate]).expect(200);
    await request(baseUrl)
      .put(`/api/blocks`)
      .set('Cookie', memberCookie)
      .send([cardWithoutPermissionsUpdate])
      .expect(401);

    await request(baseUrl)
      .put(`/api/blocks`)
      .set('Cookie', memberCookie)
      .send([
        boardUpdate,
        cardWithPermissionsUpdate,
        viewUpdate,
        // This should block the update of the other cards
        cardWithoutPermissionsUpdate
      ])
      .expect(401);
  });
});
