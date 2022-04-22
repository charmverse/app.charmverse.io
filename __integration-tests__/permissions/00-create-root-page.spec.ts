/* eslint-disable @typescript-eslint/no-unused-vars */
import { Page, Prisma, Space, SpaceApiToken, User } from '@prisma/client';
import { createDatabase, createDatabaseCardPage, InvalidCustomPropertyValueError, Page as ApiPage, PageProperty, UnsupportedKeysError } from 'lib/public-api';
import request from 'supertest';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { v4 } from 'uuid';
import { IPageWithPermissions } from 'lib/pages';

let databasePage: Page;
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

  databasePage = await createDatabase({
    title: 'Some title',
    createdBy: user.id,
    spaceId: space.id
  });
});

describe('POST /api/pages - create root page', () => {

  it('should assign to the phase a default permission of full access for the space members', async () => {

    const pageToCreate: Prisma.PageCreateInput = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id
    });

    const response = await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(pageToCreate)
      .expect(201);

    const createdPage = response.body as IPageWithPermissions;

    // Only 1 default permission
    expect(createdPage.permissions.length).toBe(1);
    // Verify shape
    expect(createdPage.permissions[0].permissionLevel).toBe('full_access');
    expect(createdPage.permissions[0].spaceId).toBe(space.id);
  });
});
