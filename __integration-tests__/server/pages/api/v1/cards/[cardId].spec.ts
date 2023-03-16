/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Page, Space, SpaceApiToken, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import type {
  InvalidCustomPropertyValueError,
  CardPage as ApiPage,
  PageProperty,
  UnsupportedKeysError
} from 'lib/public-api';
import { createDatabase, createDatabaseCardPage } from 'lib/public-api';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

const exampleBoardSchema: PageProperty[] = [
  {
    id: '87b42bed-1dbe-4491-9b6e-fc4c45caa81e',
    name: 'Status',
    type: 'select',
    options: [
      { id: '7154c7b1-9370-4177-8d32-5aec591b158b', color: 'propColorTeal', value: 'Completed' },
      { id: '629f8134-058a-4998-9733-042d9e75f2b0', color: 'propColorYellow', value: 'In progress' },
      { id: '62f3d1a5-68bc-4c4f-ac99-7cd8f6ceb6ea', color: 'propColorRed', value: 'Not started' }
    ]
  },
  {
    id: '55ba9b7c-0762-40e1-88c5-75de6af2c2fa',
    name: 'Contact method',
    type: 'multiSelect',
    options: [
      { id: '2fe23ec9-3e41-4f6e-84f4-dbd03eac6cb9', color: 'propColorTeal', value: 'Email' },
      { id: '381a72c3-d6e9-4f87-b3b0-edd628a374a8', color: 'propColorYellow', value: 'Phone' },
      { id: '72d50703-5556-4e9d-ad12-a61086451596', color: 'propColorRed', value: 'Whatsapp' }
    ]
  },
  {
    id: '116731bf-28b5-4237-9361-d154066627e3',
    name: 'Text',
    type: 'text',
    options: []
  }
];

let databasePage: Page;
let user: User;
let space: Space;
let apiToken: SpaceApiToken;

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
    exampleBoardSchema
  );
});

describe('GET /api/v1/cards/{cardId}', () => {
  it('should respond with 200 and return the page', async () => {
    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl).get(`/api/v1/cards/${card.id}`).set('Authorization', apiToken.token).send();

    expect(response.statusCode).toBe(200);

    // Add in actual assertions here
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

  it('should fail when the API key belongs to a different space than the page', async () => {
    const secondSpace = await generateUserAndSpaceWithApiToken();

    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .get(`/api/v1/cards/${card.id}`)
      .set('Authorization', secondSpace.apiToken.token)
      .send();

    expect(response.statusCode).toBe(401);
  });
});

describe('PATCH /api/v1/cards/{cardId}', () => {
  it('should respond with 200 and return the page', async () => {
    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .patch(`/api/v1/cards/${card.id}`)
      .set('Authorization', apiToken.token)
      .send({});

    expect(response.statusCode).toBe(200);

    // Add in actual assertions here
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

  it('should respond with 404 when the API key belongs to a different space than the page', async () => {
    const secondSpace = await generateUserAndSpaceWithApiToken();

    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .patch(`/api/v1/cards/${card.id}`)
      .set('Authorization', secondSpace.apiToken.token)
      .send();

    expect(response.statusCode).toBe(404);
  });

  it('should update a page title', async () => {
    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .patch(`/api/v1/cards/${card.id}`)
      .set('Authorization', apiToken.token)
      .send({
        title: 'New title'
      });

    expect(response.body.title).toBe('New title');
  });

  it('should respond with a 400 code when invalid properties are provided', async () => {
    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .patch(`/api/v1/cards/${card.id}`)
      .set('Authorization', apiToken.token)
      .send({
        title: 'New title',
        invalidProp: 'Prop'
      });

    expect(response.statusCode).toBe(400);
  });

  it('should explain to the user which properties are available to update', async () => {
    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .patch(`/api/v1/cards/${card.id}`)
      .set('Authorization', apiToken.token)
      .send({
        title: 'New title',
        invalidProp: 'Prop'
      });

    expect((response.body as UnsupportedKeysError).error.allowedKeys).toBeInstanceOf(Array);
  });

  it('should respond with a 400 code when invalid custom properties are provided', async () => {
    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .patch(`/api/v1/cards/${card.id}`)
      .set('Authorization', apiToken.token)
      .send({
        title: 'New title',
        properties: {
          invalidProp: 'Prop'
        }
      });

    expect(response.statusCode).toBe(400);
  });

  it('should tell the user which custom properties are available', async () => {
    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .patch(`/api/v1/cards/${card.id}`)
      .set('Authorization', apiToken.token)
      .send({
        title: 'New title',
        properties: {
          invalidProp: 'Prop'
        }
      });

    exampleBoardSchema.forEach((schema) => {
      expect((response.body as UnsupportedKeysError).error.allowedKeys).toContain(schema.name);
    });
  });

  it('should reject updates when a custom property has an invalid value, and tell the user which values are available to select', async () => {
    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    const response = await request(baseUrl)
      .patch(`/api/v1/cards/${card.id}`)
      .set('Authorization', apiToken.token)
      .send({
        title: 'New title',
        properties: {
          Status: 'Invalid option'
        }
      });

    exampleBoardSchema[0].options.forEach((option) => {
      expect((response.body as InvalidCustomPropertyValueError).error.validOptions).toContain(option.value);
    });
  });
});

export default {};
