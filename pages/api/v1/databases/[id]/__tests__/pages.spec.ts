import { Page, Space, User } from '@prisma/client';
import { createDatabase } from 'lib/public-api/createDatabaseCardPage';
import { getBotUser } from 'lib/middleware';
import { createMocks } from 'node-mocks-http';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { createPage } from '../pages';

let testUser: User;
let testSpace: Space;
let database: Page;

beforeAll(async () => {

  const { user, space } = await generateUserAndSpace();
  testUser = user;
  testSpace = space;

  database = await createDatabase({
    title: 'Example title',
    createdBy: user.id,
    spaceId: space.id
  });
});

describe('createPages', () => {
  it('should create a page with the given title', async () => {

    const { req, res } = createMocks({
      authorizedSpaceId: testSpace.id,
      botUser: testUser,
      body: {
        title: 'Example title'
      },
      query: {
        id: database.boardId
      }
    });

    await createPage(req as any, res as any);

    // Raw JSON does not have access to prototypes
    // This is a pageFromBlock
    const jsonData = res._getJSONData();
    expect(jsonData).toHaveProperty('content');
    expect(jsonData).toHaveProperty('createdAt');
    expect(jsonData).toHaveProperty('updatedAt');
    expect(jsonData).toHaveProperty('id');
    expect(jsonData).toHaveProperty('isTemplate');
    expect(jsonData).toHaveProperty('properties');
    expect(jsonData.databaseId).toEqual(req.query.id);
    expect(jsonData.title).toBe(req.body.title);

    expect(res.statusCode).toEqual(201);

  });
});
