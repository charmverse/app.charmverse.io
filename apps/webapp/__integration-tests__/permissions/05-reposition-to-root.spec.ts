/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import type { PageWithPermissions } from '@packages/core/pages';
import type { LoggedInUser } from '@packages/profile/getUser';
import { generatePageToCreateStub } from '@packages/testing/generateStubs';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';

import { getPage } from 'lib/pages/server';

let user: LoggedInUser;
let space: Space;
let cookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();

  user = generated.user;
  space = generated.space;
  cookie = await loginUser(user.id);
});

describe('PUT /api/pages/{pageId} - reposition page to root', () => {
  it('should convert inherited permissions to locally defined permissions', async () => {
    const rootPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    const childPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            parentId: rootPage.id
          })
        )
        .expect(201)
    ).body;

    await request(baseUrl)
      .put(`/api/pages/${childPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: childPage.id,
        parentId: null
      })
      .expect(200);

    const childWithPermissions = await getPage(childPage.id);

    // Base space permission plus createdBy user full access permission
    expect(childWithPermissions?.permissions.length).toBe(2);
    expect(childWithPermissions?.permissions.every((perm) => perm.inheritedFromPermission === null)).toBe(true);
  });

  it('should update the children to inherit from the new root page instead of the old root page', async () => {
    const rootPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id
          })
        )
        .expect(201)
    ).body;

    const childPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            parentId: rootPage.id
          })
        )
        .expect(201)
    ).body;

    const nestedChildPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            parentId: childPage.id
          })
        )
        .expect(201)
    ).body;

    const superNestedChildPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            parentId: childPage.id
          })
        )
        .expect(201)
    ).body;

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
    ])) as PageWithPermissions[];

    // Base space permission plus createdBy user full access permission
    expect(childWhichBecameRoot.permissions.length).toBe(2);

    const sourcePermissionIds = childWhichBecameRoot.permissions.map((p) => p.id);

    expect(
      nestedChildWithPermissions.permissions.every(
        (perm) => sourcePermissionIds.indexOf(perm.inheritedFromPermission as string) >= 0
      )
    ).toBe(true);
    expect(
      superNestedChildWithPermissions.permissions.every(
        (perm) => sourcePermissionIds.indexOf(perm.inheritedFromPermission as string) >= 0
      )
    ).toBe(true);
  });
});
