/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
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

describe('PUT /api/pages/{pageId} - reposition page to root', () => {

  it('should convert inherited permissions to locally defined permissions', async () => {

    const rootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id
      }))
      .expect(201)).body as IPageWithPermissions;

    const childPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: rootPage.id
      }))
      .expect(201)).body;

    const childWithPermissions = (await request(baseUrl)
      .put(`/api/pages/${childPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: childPage.id,
        parentId: null
      })
      .expect(200)).body as IPageWithPermissions;

    // Base space permission plus createdBy user full access permission
    expect(childWithPermissions.permissions.length).toBe(2);
    expect(childWithPermissions.permissions.every(perm => perm.inheritedFromPermission === null)).toBe(true);
  });

  it('should update the children to inherit from the new root page instead of the old root page', async () => {

    const rootPage = (await request(baseUrl)
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
        parentId: rootPage.id
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

    const superNestedChildPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: childPage.id
      }))
      .expect(201)).body;

    await request(baseUrl)
      .put(`/api/pages/${childPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: childPage.id,
        parentId: null
      })
      .expect(200);

    const [childWhichBecameRoot, nestedChildWithPermissions, superNestedChildWithPermissions] = (await Promise.all([
      getPage(childPage.id),
      getPage(nestedChildPage.id),
      getPage(superNestedChildPage.id)
    ])) as IPageWithPermissions[];

    // Base space permission plus createdBy user full access permission
    expect(childWhichBecameRoot.permissions.length).toBe(2);

    const sourcePermissionIds = childWhichBecameRoot.permissions.map(p => p.id);

    expect(nestedChildWithPermissions.permissions.every(perm => sourcePermissionIds.indexOf(perm.inheritedFromPermission as string) >= 0)).toBe(true);
    expect(superNestedChildWithPermissions
      .permissions
      .every(perm => sourcePermissionIds.indexOf(perm.inheritedFromPermission as string) >= 0))
      .toBe(true);
  });
});
