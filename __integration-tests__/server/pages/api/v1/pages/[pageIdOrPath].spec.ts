import type { Page, Space, SpaceApiToken, User } from '@prisma/client';
import request from 'supertest';

import type { PublicApiPage } from 'lib/public-api/getPageApi';
import { baseUrl } from 'testing/mockApiCall';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let page: Page;
let user: User;
let space: Space;
let apiToken: SpaceApiToken;
let pageApiAssertion: PublicApiPage;

const pageText = `This is an awesome page content!`;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();

  user = generated.user;
  space = generated.space;
  apiToken = generated.apiToken;

  page = await createPage({
    title: 'Some title',
    createdBy: user.id,
    spaceId: space.id,
    contentText: pageText,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              text: pageText,
              type: 'text'
            }
          ]
        }
      ]
    }
  });

  pageApiAssertion = {
    createdAt: page.createdAt.toISOString() as any,
    content: {
      text: pageText,
      markdown: pageText
    },
    id: page.id,
    title: page.title,

    url: `${baseUrl}/${space?.domain}/${page.path}`
  };
});

describe('GET /api/v1/pages/{pageId}', () => {
  it('should find page by id, respond with 200 and return the page', async () => {
    const response = await request(baseUrl).get(`/api/v1/pages/${page.id}`).set('Authorization', apiToken.token).send();

    expect(response.statusCode).toBe(200);

    // Add in actual assertions here
    expect(response.body).toEqual<PublicApiPage>(expect.objectContaining<PublicApiPage>(pageApiAssertion));
  });

  it('should find page by path, respond with 200 and return the page', async () => {
    const response = await request(baseUrl)
      .get(`/api/v1/pages/${page.path}`)
      .set('Authorization', apiToken.token)
      .send();

    expect(response.statusCode).toBe(200);

    // Add in actual assertions here
    expect(response.body).toEqual<PublicApiPage>(expect.objectContaining<PublicApiPage>(pageApiAssertion));
  });

  it('should throw when trying to fetch page from unauthorised space', async () => {
    const { apiToken: apiToken2 } = await generateUserAndSpaceWithApiToken();

    await request(baseUrl).get(`/api/v1/pages/${page.path}`).set('Authorization', apiToken2.token).send().expect(404);
  });
});

export default {};
