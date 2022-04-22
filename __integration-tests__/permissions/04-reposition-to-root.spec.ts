/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { getPage, IPageWithPermissions } from '../../lib/pages';

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

    const rootPermissionId = rootPage.permissions[0].id;

    const childPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: rootPage.id
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

    const childWithPermissions = (await getPage(childPage.id)) as IPageWithPermissions;

    // Only 1 default permission
    expect(childWithPermissions.permissions.length).toBe(1);
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

    expect(childWhichBecameRoot.permissions.length).toBe(1);

    const newRootPermissionId = childWhichBecameRoot.permissions[0].id;

    expect(nestedChildWithPermissions.permissions.every(perm => perm.inheritedFromPermission === newRootPermissionId)).toBe(true);
    expect(superNestedChildWithPermissions.permissions.every(perm => perm.inheritedFromPermission === newRootPermissionId)).toBe(true);
  });
});
