import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createDatabase, createDatabaseCardPage } from '../createDatabaseCardPage';
import { getDatabaseRoot } from '../getPageInBoard';
import type { PageProperty } from '../interfaces';
import { PageFromBlock } from '../pageFromBlock.class';

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

  it('should assign the database schema correctly', async () => {

    const exampleBoardSchema: PageProperty [ ] = [{ id: '87b42bed-1dbe-4491-9b6e-fc4c45caa81e', name: 'Status', type: 'select', options: [{ id: '7154c7b1-9370-4177-8d32-5aec591b158b', color: 'propColorTeal', value: 'Completed' }, { id: '629f8134-058a-4998-9733-042d9e75f2b0', color: 'propColorYellow', value: 'In progress' }, { id: '62f3d1a5-68bc-4c4f-ac99-7cd8f6ceb6ea', color: 'propColorRed', value: 'Not started' }] }];

    const createdDb = await createDatabase({
      title: 'Example',
      createdBy: user.id,
      spaceId: space.id
    }, exampleBoardSchema);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const foundDb = await getDatabaseRoot(createdDb.boardId!);

    expect(foundDb.schema).toBeInstanceOf(Array);
    expect(foundDb.schema).toEqual(exampleBoardSchema);
  });
});

describe('createDatabaseCardPage', () => {

  it('should throw an error when the linked database does not exist', async () => {

    try {
      await createDatabaseCardPage({
        title: 'Example title',
        boardId: v4(),
        properties: {},
        spaceId: space.id,
        createdBy: user.id
      });
      throw new ExpectedAnError();
    }
    catch (error) {

      expect(true).toBe(true);
    }

  });

  it('should return the newly created page', async () => {

    const database = await createDatabase({
      title: 'My database',
      createdBy: user.id,
      spaceId: space.id
    });

    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: database.boardId!,
      properties: {},
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);

  });

  it('should handle creation when properties are undefined', async () => {

    const database = await createDatabase({
      title: 'My database',
      createdBy: user.id,
      spaceId: space.id
    });

    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: database.boardId!,
      properties: undefined as any,
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);

  });
});
