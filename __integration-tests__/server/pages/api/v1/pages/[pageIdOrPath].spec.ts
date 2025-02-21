import type { Page, Space, SpaceApiToken, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/testing/mockApiCall';
import { createPage, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';

import type { UserProfile } from 'lib/public-api';
import type { PublicApiPage } from 'lib/public-api/getPageApi';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';

let page: Page;
let user: UserProfile;
let space: Space;
let apiToken: SpaceApiToken;
let pageApiAssertion: PublicApiPage;

const pageText = `This is an awesome page content!`;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = getUserProfile(
    await prisma.user.findUniqueOrThrow({ where: { id: generated.user.id }, select: userProfileSelect })
  );
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
    author: user,
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
