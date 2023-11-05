/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import type { Block } from '@charmverse/core/prisma-client';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { LoggedInUser } from 'models';
import type { ServerBlockFields } from 'pages/api/blocks';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBoard, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: LoggedInUser;
let adminUserSpace: Space;
let adminCookie: string;

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);

  const second = await generateUserAndSpaceWithApiToken();

  adminUser = second.user;
  adminUserSpace = second.space;
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

    const input: Omit<Block, ServerBlockFields> = {
      createdAt: new Date(),
      deletedAt: null,
      fields: {},
      id: uuid(),
      parentId: board.id,
      rootId: board.id,
      schema: -1,
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
    ).body as Block[];

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

    const input: Omit<Block, ServerBlockFields> = {
      createdAt: new Date(),
      deletedAt: null,
      fields: {},
      id: uuid(),
      parentId: board.id,
      rootId: board.id,
      schema: -1,
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
