import type { SpaceApiToken, User, Space } from '@charmverse/core/prisma';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 } from 'uuid';

import type { DatabasePage } from 'lib/public-api';
import { createDatabase } from 'lib/public-api/createDatabase';

let user: User;
let space: Space;
let apiToken: SpaceApiToken;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();

  user = generated.user;
  space = generated.space;
  apiToken = generated.apiToken;
});

describe('GET /databases/{id}', () => {
  it('should respond with 200 status and the created database', async () => {
    const database = await createDatabase({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Title'
    });

    const response = await request(baseUrl)
      .get(`/api/v1/databases/${database.boardId}`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send({});

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual<DatabasePage>(
      expect.objectContaining<DatabasePage>({
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        id: expect.any(String),
        spaceId: expect.any(String),
        title: expect.any(String),
        schema: expect.any(Array),
        type: expect.stringMatching('board'),
        url: expect.any(String)
      })
    );
  });

  it('should respond with 401 status when an invalid API key is provided', async () => {
    const response = await request(baseUrl)
      .get(`/api/v1/databases/${v4()}`)
      .set('Authorization', `Bearer ${v4()}`)
      .send({});

    expect(response.statusCode).toBe(401);
  });

  it('should respond with 404 status when the database exists, but the API token belongs to a different space', async () => {
    const database = await createDatabase({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Title'
    });

    const secondSpace = await generateUserAndSpaceWithApiToken();

    const response = await request(baseUrl)
      .get(`/api/v1/databases/${database.boardId}`)
      .set('Authorization', `Bearer ${secondSpace.apiToken.token}`)
      .send({});

    expect(response.statusCode).toBe(404);
  });

  it('should respond with 404 status when the database does not exist', async () => {
    const response = await request(baseUrl)
      .get(`/api/v1/databases/${v4()}`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send({});

    expect(response.statusCode).toBe(404);
  });
});
