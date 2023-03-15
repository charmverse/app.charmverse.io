/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, SpaceApiToken, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createPage } from 'lib/pages/server/createPage';
import { InvalidInputError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createDatabase, createDatabaseCardPage } from '../createDatabaseCardPage';
import { DatabasePageNotFoundError, PageNotFoundError } from '../errors';
import { getDatabaseRoot, getPageInBoard } from '../getPageInBoard';
import type { DatabasePage, CardPage } from '../interfaces';

let user: User;
let space: Space;
let apiToken: SpaceApiToken;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
  apiToken = generated.apiToken;
});

describe('getPageInBoard', () => {
  it('should return the page', async () => {
    const databasePage = await createDatabase({
      title: 'Some title',
      createdBy: user.id,
      spaceId: space.id
    });

    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const foundCard = await getPageInBoard(card.id);

    // Add in actual assertions here
    expect(foundCard).toEqual<CardPage>(
      expect.objectContaining<CardPage>({
        content: expect.any(Object),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        databaseId: expect.any(String),
        id: expect.any(String),
        isTemplate: expect.any(Boolean),
        properties: expect.any(Object),
        spaceId: expect.any(String),
        title: expect.any(String)
      })
    );
  });

  it('should throw a database not found error when the database for the page does not exist', async () => {
    const databasePage = await createDatabase({
      title: 'Some title',
      createdBy: user.id,
      spaceId: space.id
    });

    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    // Remove the database
    await prisma.block.deleteMany({
      where: {
        type: 'board',
        id: card.databaseId
      }
    });

    try {
      const foundCard = await getPageInBoard(card.id);
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(DatabasePageNotFoundError);
    }
  });

  it('should throw a page not found error when the page does not exist', async () => {
    try {
      const inexistentId = v4();
      const foundCard = await getPageInBoard(inexistentId);
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(PageNotFoundError);
    }
  });

  it('should throw a page not found error when the page does not have the board type', async () => {
    const page = await createPage({
      data: {
        title: 'Example title',
        contentText: '',
        path: v4(),
        type: 'page',
        updatedBy: user.id,
        author: {
          connect: {
            id: user.id
          }
        },
        space: {
          connect: {
            id: space.id
          }
        }
      }
    });

    try {
      await getPageInBoard(page.id);
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(PageNotFoundError);
    }
  });
});

describe('getDatabaseRoot', () => {
  it('should return a database by passing an ID', async () => {
    const database = await createDatabase({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Example'
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const found = await getDatabaseRoot(database.boardId!);

    expect(found).toEqual<DatabasePage>(
      expect.objectContaining<DatabasePage>({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        id: expect.any(String),
        spaceId: expect.any(String),
        title: expect.any(String),
        schema: expect.any(Array),
        type: expect.stringMatching('board'),
        url: expect.any(String)
      })
    );
  });

  it('should return a database by passing a page path and spaceId', async () => {
    const database = await createDatabase({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Example'
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const found = await getDatabaseRoot(database.path, space.id);

    expect(found).toEqual<DatabasePage>(
      expect.objectContaining<DatabasePage>({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        id: expect.any(String),
        spaceId: expect.any(String),
        title: expect.any(String),
        schema: expect.any(Array),
        type: expect.stringMatching('board'),
        url: expect.any(String)
      })
    );
  });

  it('should throw an error when passing a page path without a spaceId', async () => {
    const database = await createDatabase({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Example'
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

    try {
      await getDatabaseRoot(database.path);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
    }
  });
});

export default {};
