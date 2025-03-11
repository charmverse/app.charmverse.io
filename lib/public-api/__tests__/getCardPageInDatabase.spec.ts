/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, SpaceApiToken, User } from '@charmverse/core/prisma';
import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { createPage } from '@root/lib/pages/server/createPage';
import { v4 } from 'uuid';

import { createDatabase } from '../createDatabase';
import { createDatabaseCardPage } from '../createDatabaseCardPage';
import { DatabasePageNotFoundError, PageNotFoundError } from '../errors';
import { getCardPageInDatabase } from '../getCardPageInDatabase';
import type { CardPage } from '../interfaces';
import type { PageFromBlock } from '../pageFromBlock.class';

describe('getCardPageInDatabase', () => {
  const textSchema = generateSchema({ type: 'text' });
  const selectSchema = generateSchema({ type: 'select', options: ['Green', 'Yellow', 'Red'] });
  const checkboxSchema = generateSchema({ type: 'checkbox' });

  const cardProperties = {
    [textSchema.name]: 'Some text',
    [selectSchema.id]: 'Green',
    [checkboxSchema.id]: true
  };

  let user: User;
  let space: Space;
  let apiToken: SpaceApiToken;
  let databasePage: Page;
  let card: PageFromBlock;

  beforeAll(async () => {
    const generated = await generateUserAndSpaceWithApiToken();
    user = generated.user;
    space = generated.space;
    apiToken = generated.apiToken;
    databasePage = await createDatabase(
      {
        title: 'Some title',
        createdBy: user.id,
        spaceId: space.id
      },
      [textSchema, selectSchema, checkboxSchema]
    );
    card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: cardProperties,
      spaceId: space.id,
      title: 'Example card'
    });
  });

  it('should return the page along with its properties', async () => {
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

  it('should accept a page path instead of a page ID', async () => {
    const pagePath = (await prisma.page.findUnique({
      where: {
        id: card.id
      },
      select: {
        path: true
      }
    })) as { path: string };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const foundCard = await getCardPageInDatabase({ cardId: pagePath.path, spaceId: space.id });

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

  it('should accept an additional page path instead of a page ID', async () => {
    const randomAdditionalPath = 'path-32288844';

    const pagePath = (await prisma.page.update({
      where: {
        id: card.id
      },
      data: {
        additionalPaths: {
          push: randomAdditionalPath
        }
      },
      select: {
        path: true
      }
    })) as { path: string };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const foundCard = await getCardPageInDatabase({ cardId: randomAdditionalPath, spaceId: space.id });

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
    const deletedDatabase = await createDatabase(
      {
        title: 'Some title',
        createdBy: user.id,
        spaceId: space.id
      },
      [textSchema, selectSchema, checkboxSchema]
    );
    const deletedCard = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: deletedDatabase.id!,
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
