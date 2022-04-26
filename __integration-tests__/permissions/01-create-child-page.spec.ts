/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';

let user: User;
let space: Space;
let cookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());

  user = generated.user;
  space = generated.space;

  const loggedInResponse = await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: user.addresses[0]
    });

  cookie = loggedInResponse.headers['set-cookie'][0];

});

describe('POST /api/pages - create child pages', () => {

  it('should assign the permissions of the parent to the child', async () => {

    const rootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        title: 'Root'
      }))
      .expect(201)).body;

    const childPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        title: 'Child',
        parentId: rootPage.id
      }))
      .expect(201)).body;

    // Only 1 default permission
    expect(childPage.parentId).toBe(rootPage.id);
    expect(childPage.permissions.length).toBe(1);
    expect(childPage.permissions[0].inheritedFromPermission).toBe(rootPage.permissions[0].id);
  });

  it('should forward inherited permission references to nested children', async () => {

    const createdPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id
      }))
      .expect(201)).body;

    const childPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: createdPage.id
      }))
      .expect(201)).body;

    const nestedChildPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: childPage.id
      }))
      .expect(201)).body;

    // Only 1 default permission
    expect(nestedChildPage.permissions.length).toBe(1);
    expect(nestedChildPage.permissions[0].inheritedFromPermission).toBe(createdPage.permissions[0].id);
  });
});
