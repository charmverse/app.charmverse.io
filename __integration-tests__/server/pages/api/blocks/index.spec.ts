import type { Space, User } from '@charmverse/core/prisma';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { BlockWithDetails } from 'lib/databases/block';
import type { ServerBlockFields } from 'pages/api/blocks';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBoard, generateUserAndSpace } from 'testing/setupDatabase';

let adminUser: User;
let adminUserSpace: Space;
let adminCookie: string;

beforeAll(async () => {
  const { user, space } = await generateUserAndSpace();

  adminUser = user;
  adminUserSpace = space;
  adminCookie = await loginUser(adminUser.id);
});

describe('POST /api/blocks', () => {
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
