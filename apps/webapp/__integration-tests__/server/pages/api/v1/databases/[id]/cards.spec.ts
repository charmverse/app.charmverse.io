import type { Page, Space, SpaceApiToken, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import type { Response } from 'supertest';
import request from 'supertest';

import type { CardPage as ApiPage, UnsupportedKeyDetails, UnsupportedKeysError } from 'lib/public-api';
import { createDatabase } from 'lib/public-api/createDatabase';

describe('POST /databases/{id}/cards', () => {
  const textSchema = generateSchema({ type: 'text' });
  const selectSchema = generateSchema({ type: 'select' });

  let database: Page;
  let user: User;
  let space: Space;
  let apiToken: SpaceApiToken;

  // Setup value we can assert against, ignore the rest of the request
  let failedCreateResponse: { body: UnsupportedKeysError };

  function invalidCreateRequest(): Promise<Response> {
    return request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/cards`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send({
        title: 'Example',
        unsupportedProperty: ''
      });
  }

  beforeAll(async () => {
    const generated = await generateUserAndSpaceWithApiToken();
    user = generated.user;
    space = generated.space;
    apiToken = generated.apiToken;

    database = await createDatabase(
      {
        title: 'Example title',
        createdBy: user.id,
        spaceId: space.id
      },
      [textSchema, selectSchema]
    );

    failedCreateResponse = await invalidCreateRequest();
  });

  it('should create a new card in the database', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/cards`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send({
        title: 'Example',
        properties: {
          [textSchema.id]: 'Example text',
          [selectSchema.id]: [selectSchema.options[0].id]
        }
      })
      .expect(201);

    //    TODO; // HANDLE EMPTY PROPERTIES

    expect(response.body).toEqual<ApiPage>(
      expect.objectContaining<ApiPage>({
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

    const page = await prisma.page.findUnique({
      where: {
        id: (response.body as ApiPage).id
      }
    });

    expect(page).toBeTruthy();
  });

  it('should create a new card in the database without needing custom properties', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/cards`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send({
        title: 'Example'
      });
    expect(response.body).toEqual<ApiPage>(
      expect.objectContaining<ApiPage>({
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

  it('should fail with 400 error code when invalid properties are provided', async () => {
    const response = await invalidCreateRequest();

    expect(response.statusCode).toBe(400);
  });

  it('should inform the user which invalid properties were provided', async () => {
    expect((failedCreateResponse.body.error as UnsupportedKeyDetails).unsupportedKeys).toContain('unsupportedProperty');
  });

  it('should inform the user which valid properties are available', async () => {
    expect(failedCreateResponse.body.error.allowedKeys).toBeInstanceOf(Array);
  });
});
