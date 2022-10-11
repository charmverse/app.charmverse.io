/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import type { IPageWithPermissions } from 'lib/pages';
import type { LoggedInUser } from 'models';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user: LoggedInUser;
let space: Space;
let cookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());

  user = generated.user;
  space = generated.space;

  cookie = await loginUser(user.id);
});

describe('POST /api/pages - create root page', () => {

  it('should assign to the page a default permission of full access for the space members, and a full acces permission for the creating user', async () => {

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id
    });

    const response = await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(pageToCreate)
      .expect(201);

    const createdPage = response.body as IPageWithPermissions;

    // Base space permission plus createdBy user full access permission
    expect(createdPage.permissions.length).toBe(2);
    // Verify shape
    expect(createdPage.permissions.find(p => typeof p.userId === 'string')?.permissionLevel).toBe('full_access');
    expect(createdPage.permissions.find(p => typeof p.spaceId === 'string')?.permissionLevel).toBe('full_access');
  });
});
