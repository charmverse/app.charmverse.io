import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';

import { createDatabase } from '../createDatabase';
import type { PageProperty } from '../interfaces';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('createDatabase', () => {
  it('should create a page with the type of board', async () => {
    const createdDb = await createDatabase({
      title: 'Example',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(createdDb.type).toBe('board');
    expect(createdDb.boardId).toBeDefined();
  });

  it('should not setup page permissions', async () => {
    const createdDb = await createDatabase({
      title: 'Example',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(createdDb.type).toBe('board');
    expect(createdDb.boardId).toBeDefined();

    const permissions = await prisma.pagePermission.count({
      where: {
        pageId: createdDb.id
      }
    });

    expect(permissions).toEqual(0);
  });

  it('should assign the database schema correctly', async () => {
    const exampleBoardSchema: PageProperty[] = [
      {
        id: '87b42bed-1dbe-4491-9b6e-fc4c45caa81e',
        name: 'Status',
        type: 'select',
        options: [
          { id: '7154c7b1-9370-4177-8d32-5aec591b158b', color: 'propColorTeal', value: 'Completed' },
          { id: '629f8134-058a-4998-9733-042d9e75f2b0', color: 'propColorYellow', value: 'In progress' },
          { id: '62f3d1a5-68bc-4c4f-ac99-7cd8f6ceb6ea', color: 'propColorRed', value: 'Not started' }
        ]
      }
    ];

    const createdDb = await createDatabase(
      {
        title: 'Example',
        createdBy: user.id,
        spaceId: space.id
      },
      exampleBoardSchema
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const schema = (
      (
        await prisma.block.findUnique({
          where: {
            id: createdDb.id,
            type: 'board'
          }
        })
      )?.fields as any
    ).cardProperties;

    expect(schema).toBeInstanceOf(Array);
    expect(schema).toEqual(exampleBoardSchema);
  });
});
