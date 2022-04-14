/* eslint-disable @typescript-eslint/no-unused-vars */
import { createDatabase, createDatabaseCardPage, Page } from 'lib/public-api';
import request from 'supertest';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';

describe('GET /api/v1/pages/{pageId}', () => {

  it('should respond with 200 and return the page', async () => {

    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(v4());

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

    const response = await request(baseUrl)
      .get(`/api/v1/pages/${card.id}`)
      .set('Authorization', apiToken.token)
      .send();

    expect(response.statusCode).toBe(200);

    // Add in actual assertions here
    expect(response.body).toEqual<Page>(
      expect.objectContaining<Page>({
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

    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(v4());

    const secondSpace = await generateUserAndSpaceWithApiToken(v4());

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

    const response = await request(baseUrl)
      .get(`/api/v1/pages/${card.id}`)
      .set('Authorization', secondSpace.apiToken.token)
      .send();

    expect(response.statusCode).toBe(401);

  });

});

export default {};
