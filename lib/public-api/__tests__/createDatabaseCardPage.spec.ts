import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { ExpectedAnError } from 'testing/errors';
import { generateSchema } from 'testing/publicApi/schemas';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createDatabase } from '../createDatabase';
import { createDatabaseCardPage } from '../createDatabaseCardPage';
import { PageFromBlock } from '../pageFromBlock.class';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

const textSchema = generateSchema({ type: 'text' });
const numberSchema = generateSchema({ type: 'number' });
const selectSchema = generateSchema({ type: 'select', options: ['Green', 'Yellow', 'Red'] });

describe('createDatabaseCardPage', () => {
  it('should throw an error when the linked database does not exist', async () => {
    try {
      await createDatabaseCardPage({
        title: 'Example title',
        boardId: uuid(),
        properties: {},
        spaceId: space.id,
        createdBy: user.id
      });
      throw new ExpectedAnError();
    } catch (error) {
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

  it('should support a board page path as the target board ID', async () => {
    const database = await createDatabase({
      title: 'My database',
      createdBy: user.id,
      spaceId: space.id
    });

    const databasePage = await prisma.page.findUnique({
      where: {
        id: database.id
      },
      select: {
        path: true
      }
    });

    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage?.path as string,
      properties: {},
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);
  });

  it('should not setup any page permissions', async () => {
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

    const permissions = await prisma.pagePermission.count({
      where: {
        pageId: createdPage.id
      }
    });

    expect(permissions).toEqual(0);
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

  it('should pass properties when creating the card', async () => {
    const database = await createDatabase(
      {
        title: 'My database',
        createdBy: user.id,
        spaceId: space.id
      },
      [textSchema, numberSchema, selectSchema]
    );

    const cardProps = {
      [textSchema.id]: 'Text',
      [selectSchema.name]: 'Green',
      [numberSchema.name]: 5
    };

    const card = await createDatabaseCardPage({
      boardId: database.id,
      createdBy: user.id,
      properties: cardProps,
      spaceId: space.id,
      title: 'Example title'
    });

    // We expect a set of human friendly keys and values
    expect(card.properties).toEqual({
      [textSchema.name]: cardProps[textSchema.id],
      [selectSchema.name]: cardProps[selectSchema.name],
      [numberSchema.name]: cardProps[numberSchema.name]
    });
  });
});
