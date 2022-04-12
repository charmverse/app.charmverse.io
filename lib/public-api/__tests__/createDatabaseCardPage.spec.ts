import { Space, User } from '@prisma/client';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createDatabase, createDatabaseCardPage } from '../createDatabaseCardPage';
import { PageFromBlock } from '../pageFromBlock.class';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
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
      throw {
        error: 'Expected an error'
      };
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
});
