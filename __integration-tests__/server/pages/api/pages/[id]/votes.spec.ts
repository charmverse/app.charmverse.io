import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { Page, Space, User } from '@prisma/client';

let page1: Page;
let page2: Page;
let space1: Space;
let space2: Space;
let user1: User;
let user2: User;

let user1Cookie: string;

beforeAll(async () => {
  const { space: generatedSpace1, user: generatedUser1 } = await generateUserAndSpaceWithApiToken(undefined, true);
  const { space: generatedSpace2, user: generatedUser2 } = await generateUserAndSpaceWithApiToken(undefined, true);
  user1 = generatedUser1;
  user2 = generatedUser2;
  space1 = generatedSpace1;
  space2 = generatedSpace2;

  page1 = await createPage({
    createdBy: user1.id,
    spaceId: space1.id
  });

  page2 = await createPage({
    createdBy: user2.id,
    spaceId: space2.id
  });

  user1Cookie = await loginUser(user1);
});

describe('POST /api/pages/{id}/votes', () => {
  it('Should succeed if the user have read access to the page, respond 200', async () => {
    await request(baseUrl).get(`/api/pages/${page1.id}/votes`).set('Cookie', user1Cookie).expect(200);
  });

  it('Should fail if the user don\'t have read access to the page', async () => {
    await request(baseUrl).get(`/api/pages/${page2.id}/votes`).set('Cookie', user1Cookie).expect(404);
  });
});
