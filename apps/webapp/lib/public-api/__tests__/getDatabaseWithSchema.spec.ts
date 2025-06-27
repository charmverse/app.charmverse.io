import type { Page, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';

import { createDatabase } from '../createDatabase';
import { DatabasePageNotFoundError } from '../errors';
import { getDatabaseWithSchema } from '../getDatabaseWithSchema';
import type { DatabasePage } from '../interfaces';

let user: User;
let space: Space;
let database: Page;

const textSchema = generateSchema({ type: 'text' });
const selectSchema = generateSchema({ type: 'select', options: ['Green', 'Yellow', 'Red'] });

const boardSchema = [textSchema, selectSchema];

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({});
  user = generated.user;
  space = generated.space;
  database = await createDatabase(
    {
      createdBy: user.id,
      spaceId: space.id,
      title: 'My database'
    },
    boardSchema
  );
});

describe('getDatabaseWithSchema', () => {
  it('should return the schema of a database and info about the page', async () => {
    const databaseWithSchema = await getDatabaseWithSchema({
      databaseId: database.id,
      spaceId: space.id
    });

    expect(databaseWithSchema).toEqual<DatabasePage>({
      id: database.id,
      title: database.title,
      createdAt: expect.any(Date),
      spaceId: space.id,
      schema: expect.arrayContaining(boardSchema),
      type: 'board',
      updatedAt: expect.any(Date),
      url: `${process.env.DOMAIN}/${space.domain}/${database.path}`
    });
  });

  it('should support lookup of a schema using the page path, additional page path or a standalone database ID', async () => {
    const additionalPagePath = `page-database-223848885`;

    await prisma.page.update({
      where: {
        id: database.id
      },
      data: {
        additionalPaths: {
          set: [additionalPagePath]
        }
      }
    });

    const results = await Promise.all([
      getDatabaseWithSchema({
        databaseId: database.path,
        spaceId: space.id
      }),
      getDatabaseWithSchema({
        databaseId: database.id,
        spaceId: space.id
      }),
      getDatabaseWithSchema({
        databaseId: database.id,
        spaceId: undefined
      }),
      getDatabaseWithSchema({
        databaseId: additionalPagePath,
        spaceId: space.id
      })
    ]);

    for (const result of results) {
      expect(result).toEqual<DatabasePage>({
        id: database.id,
        title: database.title,
        createdAt: expect.any(Date),
        spaceId: space.id,
        schema: expect.arrayContaining(boardSchema),
        type: 'board',
        updatedAt: expect.any(Date),
        url: `${process.env.DOMAIN}/${space.domain}/${database.path}`
      });
    }
  });

  it('should throw an error if the database path belongs to a different space than the space ID', async () => {
    const { space: otherSpace } = await testUtilsUser.generateUserAndSpace({});

    await expect(
      getDatabaseWithSchema({
        databaseId: database.path,
        spaceId: otherSpace.id
      })
    ).rejects.toBeInstanceOf(DatabasePageNotFoundError);

    await expect(
      getDatabaseWithSchema({
        databaseId: database.id,
        spaceId: otherSpace.id
      })
    ).rejects.toBeInstanceOf(DatabasePageNotFoundError);
  });

  it('should throw an error if the database is looked up by path without a spaceId', async () => {
    await expect(
      getDatabaseWithSchema({
        databaseId: database.path,
        spaceId: undefined
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
