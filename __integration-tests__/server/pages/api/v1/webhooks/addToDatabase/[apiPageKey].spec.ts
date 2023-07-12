import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { CardPage } from 'lib/public-api';
import { createDatabase } from 'lib/public-api/createDatabase';
import { getDatabaseWithSchema } from 'lib/public-api/getDatabaseWithSchema';
import type { TypeformResponse } from 'lib/typeform/interfaces';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();

  user = generated.user;
  space = generated.space;
});

describe('POST /api/v1/webhooks/addToDatabase/{apiPageKey}', () => {
  it('should add cards to the page, respond with 201 and return the page', async () => {
    const board = await createDatabase(
      {
        createdBy: user.id,
        spaceId: space.id,
        title: 'Test board'
      },
      // Empty schema
      []
    );

    const apiPageKey = await prisma.apiPageKey.create({
      data: {
        apiKey: uuid(),
        type: 'typeform',
        page: { connect: { id: board.id } },
        user: { connect: { id: user.id } }
      }
    });

    const sampleInput: TypeformResponse = {
      answers: [
        {
          field: { id: uuid(), type: 'short_text', title: 'Example title' },
          text: `Example text`
        }
      ],
      submitted_at: new Date().toISOString()
    };

    const response = await request(baseUrl)
      .post(`/api/v1/webhooks/addToDatabase/${apiPageKey.apiKey}`)
      .send({
        form_response: sampleInput
      })
      .expect(201);

    // Add in actual assertions here
    expect(response.body).toMatchObject({
      content: {
        markdown: ''
      },
      createdAt: expect.any(String),
      databaseId: board.id,
      id: expect.any(String),
      isTemplate: false,
      properties: expect.any(Object)
    } as CardPage);
  });

  it('should add any missing properties and leave existing ones unchanged, respond with 201 and return the page', async () => {
    const board = await createDatabase(
      {
        createdBy: user.id,
        spaceId: space.id,
        title: 'Test board'
      },
      []
    );

    const apiPageKey = await prisma.apiPageKey.create({
      data: {
        apiKey: uuid(),
        type: 'typeform',
        page: { connect: { id: board.id } },
        user: { connect: { id: user.id } }
      }
    });

    const textFieldId = uuid();

    const sampleInput: TypeformResponse = {
      definition: {
        fields: [
          {
            type: 'short_text',
            id: textFieldId
          }
        ]
      },
      answers: [
        {
          field: { id: textFieldId },
          type: 'text',
          text: `Example text`
        }
      ],
      submitted_at: new Date().toISOString()
    };

    await request(baseUrl)
      .post(`/api/v1/webhooks/addToDatabase/${apiPageKey.apiKey}`)
      .send({
        form_response: sampleInput
      })
      .expect(201);

    const { schema } = await getDatabaseWithSchema({
      databaseId: board.id
    });

    // Expect the text data
    expect(schema).toHaveLength(2);

    expect(schema.some((item) => item.type === 'text')).toBe(true);

    expect(schema.some((item) => item.type === 'date')).toBe(true);

    const numberFieldId = uuid();

    const secondSampleInput: TypeformResponse = {
      definition: {
        fields: [
          {
            type: 'number',
            id: numberFieldId
          }
        ]
      },
      answers: [
        {
          field: { id: numberFieldId },
          type: 'number',
          number: 5
        }
      ],
      submitted_at: new Date().toISOString()
    };

    await request(baseUrl)
      .post(`/api/v1/webhooks/addToDatabase/${apiPageKey.apiKey}`)
      .send({
        form_response: secondSampleInput
      })
      .expect(201);

    const { schema: schemaAfterUpdate } = await getDatabaseWithSchema({
      databaseId: board.id
    });

    // Expect the text data
    expect(schemaAfterUpdate).toHaveLength(3);

    for (const property of schema) {
      expect(schemaAfterUpdate.find((item) => item.id === property.id)).toBeDefined();
    }

    expect(schemaAfterUpdate.some((item) => item.type === 'text')).toBe(true);

    expect(schemaAfterUpdate.some((item) => item.type === 'number')).toBe(true);

    expect(schemaAfterUpdate.some((item) => item.type === 'date')).toBe(true);
  });

  it('should throw an error if the apiPageKey is invalid', async () => {
    await request(baseUrl).post(`/api/v1/webhooks/addToDatabase/${uuid()}`).send().expect(401);
  });
});
