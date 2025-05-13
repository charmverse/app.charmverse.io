import type { Page, Space, SpaceApiToken, User } from '@charmverse/core/prisma';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { uniqueValues } from '@packages/utils/array';
import request from 'supertest';

import type {
  CardPage as ApiPage,
  CardPageQuery,
  InvalidCustomPropertyKeyError,
  InvalidCustomPropertyValueError,
  PageProperty,
  PaginatedQuery,
  PaginatedResponse,
  UnsupportedKeysError
} from 'lib/public-api';
import { createDatabase } from 'lib/public-api/createDatabase';
import { createDatabaseCardPage } from 'lib/public-api/createDatabaseCardPage';

let database: Page;
let user: User;
let space: Space;
let apiToken: SpaceApiToken;
let createdPageList: ApiPage[];

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
    exampleBoardSchema
  );

  const boardId = database.boardId as string;
  const spaceId = space.id;

  const seededPages = await Promise.all([
    createDatabaseCardPage({
      boardId,
      createdBy: user.id,
      properties: {},
      spaceId,
      title: 'UPPERCASE TITLE'
    }),
    createDatabaseCardPage({
      boardId,
      createdBy: user.id,
      properties: {
        Status: 'Completed',
        'Contact method': 'Phone'
      },
      spaceId,
      title: 'lowercase title'
    }),
    createDatabaseCardPage({
      boardId,
      createdBy: user.id,
      properties: {
        Status: 'Completed',
        'Contact method': 'Whatsapp'
      },
      spaceId,
      title: 'random title'
    }),
    createDatabaseCardPage({
      boardId,
      createdBy: user.id,
      properties: {
        Status: 'In progress',
        'Contact method': 'Email'
      },
      spaceId,
      title: 'random'
    }),
    createDatabaseCardPage({
      boardId,
      createdBy: user.id,
      properties: {
        Status: 'In progress',
        'Contact method': 'Email'
      },
      spaceId,
      title: 'Example'
    })
  ]);

  createdPageList = seededPages;
});

describe('POST /databases/{id}/search', () => {
  it('should respond with a 200 code and a list of records', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        query: {}
      });

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual<PaginatedResponse<ApiPage>>(
      expect.objectContaining<PaginatedResponse<ApiPage>>({
        data: expect.any(Array),
        hasNext: expect.any(Boolean)
      })
    );
  });

  it('should support empty queries', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send();

    expect(response.body).toEqual<PaginatedResponse<ApiPage>>(
      expect.objectContaining<PaginatedResponse<ApiPage>>({
        data: expect.any(Array),
        hasNext: expect.any(Boolean)
      })
    );
  });

  it('should allow searching pages by title, matching part of the string, case insensitive', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        query: {
          title: 'title'
        }
      });

    expect(response.body).toEqual<PaginatedResponse<ApiPage>>(
      expect.objectContaining<PaginatedResponse<ApiPage>>({
        data: expect.any(Array),
        hasNext: expect.any(Boolean)
      })
    );

    const createdPagesWithMatchingTitle = createdPageList.filter(
      (item) => item.title && item.title.toLowerCase().match('title') !== null
    ).length;

    const foundPagesWithMatchingTitle = (response.body.data as ApiPage[]).map(
      (item) => item.title && item.title.toLowerCase().match('title') !== null
    ).length;

    expect(foundPagesWithMatchingTitle).toEqual(createdPagesWithMatchingTitle);
  });

  it('should support limits and return as many or less records (if none are available) than the limit provided', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        query: {}
      });

    expect(response.body.data.length).toBe(2);
  });

  it('should support pagination by reading records sequentially from the database, never returning the same record twice', async () => {
    /**
     * Load all created database records
     * @param cursor
     * @param records
     * @returns
     */
    async function recursiveRead(cursor?: string, records: ApiPage[] = []): Promise<ApiPage[]> {
      const response = await request(baseUrl)
        .post(`/api/v1/databases/${database.boardId}/search`)
        .set('Authorization', `Bearer ${apiToken.token}`)
        .send(<PaginatedQuery<CardPageQuery>>{
          limit: 2,
          cursor,
          query: {}
        });

      const foundRecords = response.body.data;
      const newCursor = response.body.cursor;

      records.push(...foundRecords);

      if (newCursor) {
        return recursiveRead(newCursor, records);
      } else {
        return records;
      }
    }

    const foundRecords: ApiPage[] = await recursiveRead();

    const recordIds = foundRecords.map((record) => record.id);

    const uniqueIdCount = uniqueValues(recordIds).length;

    expect(foundRecords.length).toBe(uniqueIdCount);
  });

  it('should respond with a 400 error when the query contains invalid properties', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        InvalidProp: true,
        query: {}
      });

    expect(response.statusCode).toBe(400);
  });

  it('should inform the user which invalid property was provided, and what a valid paginated query looks like', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        InvalidProp: true,
        query: {}
      });

    expect((response.body as UnsupportedKeysError).error.unsupportedKeys).toContain('InvalidProp');
    expect(response.body.error.example).toEqual<PaginatedQuery<any>>(
      expect.objectContaining<PaginatedQuery<any>>({
        query: expect.any(Object),
        cursor: expect.any(String),
        limit: expect.any(Number)
      })
    );
  });

  it('should respond with a 400 error when the query contains invalid custom properties', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        query: {
          properties: {
            InvalidCustomProp: 'true'
          }
        }
      });

    expect(response.statusCode).toBe(400);
  });

  it('should inform the user which invalid custom property was provided, and what custom properties are available', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        query: {
          properties: {
            InvalidProp: 'value'
          }
        }
      });

    expect((response.body as InvalidCustomPropertyKeyError).error.unsupportedKeys).toContain('InvalidProp');
    const supportedKeys = (response.body as InvalidCustomPropertyKeyError).error.allowedKeys;

    exampleBoardSchema.forEach((schema) => {
      expect(supportedKeys).toContain(schema.name);
    });
  });

  it('should respond with a 400 error when an invalid value for a select property was provided', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        query: {
          properties: {
            Status: 'Invalid status'
          }
        }
      });

    expect(response.statusCode).toBe(400);
  });

  it('should inform the user which valid properties exist for a select or multi-select type property', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        query: {
          properties: {
            Status: 'Invalid status'
          }
        }
      });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const statusSchema = exampleBoardSchema.find((schema) => schema.name === 'Status')!;

    statusSchema.options?.forEach((option) => {
      expect((response.body as InvalidCustomPropertyValueError).error.validOptions).toContain(option.value);
    });
  });

  it('should respond with a 401 error when an invalid API token is provided', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', 'Bearer invalidKey')
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        query: {}
      });

    expect(response.statusCode).toBe(401);
  });

  it('should respond a 404 error when an API token for a different space is provided', async () => {
    const differentSpace = await generateUserAndSpaceWithApiToken();

    const response = await request(baseUrl)
      .post(`/api/v1/databases/${database.boardId}/search`)
      .set('Authorization', `Bearer ${differentSpace.apiToken.token}`)
      .send(<PaginatedQuery<CardPageQuery>>{
        limit: 2,
        query: {}
      });

    expect(response.statusCode).toBe(404);
  });
});
