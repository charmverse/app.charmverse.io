/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Space } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';

import { generatePageToCreateStub } from 'testing/generateStubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user: LoggedInUser;
let space: Space;
let cookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();

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

    const response = await request(baseUrl).post('/api/pages').set('Cookie', cookie).send(pageToCreate).expect(201);

    const createdPage = response.body as PageWithPermissions;

    // Base space permission plus createdBy user full access permission
    expect(createdPage.permissions.length).toBe(2);
    // Verify shape
    expect(createdPage.permissions.find((p) => typeof p.userId === 'string')?.permissionLevel).toBe('full_access');
    expect(createdPage.permissions.find((p) => typeof p.spaceId === 'string')?.permissionLevel).toBe('full_access');
  });
});
