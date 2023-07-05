/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, SpaceApiToken, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createPage } from 'lib/pages/server/createPage';
import { ExpectedAnError } from 'testing/errors';
import { generateSchema } from 'testing/publicApi/schemas';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createDatabase } from '../createDatabase';
import { createDatabaseCardPage } from '../createDatabaseCardPage';
import { DatabasePageNotFoundError, PageNotFoundError } from '../errors';
import { getCardPageInDatabase } from '../getCardPageInDatabase';
import type { CardPage } from '../interfaces';

let user: User;
let space: Space;
let apiToken: SpaceApiToken;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
  apiToken = generated.apiToken;
});

const textSchema = generateSchema({ type: 'text' });
const selectSchema = generateSchema({ type: 'select', options: ['Green', 'Yellow', 'Red'] });
const checkboxSchema = generateSchema({ type: 'checkbox' });

describe('getCardPageInDatabase', () => {
  it('should return the page along with its properties', async () => {
    const databasePage = await createDatabase(
      {
        title: 'Some title',
        createdBy: user.id,
        spaceId: space.id
      },
      [textSchema, selectSchema, checkboxSchema]
    );
    const cardProperties = {
      [textSchema.name]: 'Some text',
      [selectSchema.id]: 'Green',
      [checkboxSchema.id]: true
    };

    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: cardProperties,
      spaceId: space.id,
      title: 'Example card'
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const foundCard = await getCardPageInDatabase({ cardId: card.id, spaceId: space.id });

    // Add in actual assertions here
    expect(foundCard).toEqual<CardPage>(
      expect.objectContaining<CardPage>({
        content: expect.any(Object),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        databaseId: expect.any(String),
        id: expect.any(String),
        isTemplate: expect.any(Boolean),
        properties: expect.objectContaining({
          [textSchema.name]: cardProperties[textSchema.name],
          [selectSchema.name]: 'Green',
          [checkboxSchema.name]: true
        }),
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
      const foundCard = await getCardPageInDatabase({ cardId: card.id, spaceId: space.id });
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(DatabasePageNotFoundError);
    }
  });

  it('should throw a page not found error when the page does not exist', async () => {
    try {
      const inexistentId = v4();
      const foundCard = await getCardPageInDatabase({ cardId: inexistentId, spaceId: space.id });
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
      await getCardPageInDatabase({ cardId: page.id, spaceId: space.id });
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(PageNotFoundError);
    }
  });
});
