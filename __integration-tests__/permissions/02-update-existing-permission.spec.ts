/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { IPagePermissionToCreate } from 'lib/permissions/pages';
import { getPage, IPageWithPermissions } from 'lib/pages';

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

describe('POST /api/permissions - upsert permissions', () => {

  it('should replace an existing permission with the same pageId and user/space/role link', async () => {

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
      .expect(201)).body as IPageWithPermissions;

    const permissionToUpsert: IPagePermissionToCreate = {
      pageId: childPage.id,
      permissionLevel: 'view',
      spaceId: space.id
    };

    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201));

    const childPageWithPermissions = (await getPage(childPage.id)) as IPageWithPermissions;

    // Only 1 default permission
    expect(childPageWithPermissions.parentId).toBe(rootPage.id);
    expect(childPageWithPermissions.permissions.length).toBe(1);
    expect(childPageWithPermissions.permissions[0].permissionLevel).toBe('view');
    expect(childPageWithPermissions.permissions[0].spaceId).toBe(space.id);
  });

  it('should cascade an updated permission down to the children, and make the page the authority for that permission (as long as it is different from the page\'s parent)', async () => {

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
      .expect(201)).body as IPageWithPermissions;

    const nestedChildPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: childPage.id
      }))
      .expect(201)).body as IPageWithPermissions;

    const permissionToUpsert: IPagePermissionToCreate = {
      pageId: childPage.id,
      permissionLevel: 'view',
      spaceId: space.id
    };

    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201));

    const nestedChildPageWithPermissions = (await getPage(nestedChildPage.id)) as IPageWithPermissions;

    // Only 1 default permission
    expect(nestedChildPageWithPermissions.parentId).toBe(childPage.id);
    expect(nestedChildPageWithPermissions.permissions.length).toBe(1);
    expect(nestedChildPageWithPermissions.permissions[0].inheritedFromPermission).toBe(childPage.permissions[0].id);
  });

  it('should re-establish inheritance if a page permission is set to the same value as a parent page, and cascade this down to its children', async () => {

    const rootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        title: 'Root'
      }))
      .expect(201)).body as IPageWithPermissions;

    const childPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: rootPage.id,
        title: 'Child'
      }))
      .expect(201)).body as IPageWithPermissions;

    const nestedChildPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: childPage.id,
        title: 'Nested'
      }))
      .expect(201)).body as IPageWithPermissions;

    const permissionToUpsert: IPagePermissionToCreate = {
      pageId: childPage.id,
      permissionLevel: 'view',
      spaceId: space.id
    };

    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201));

    const oldPermission: IPagePermissionToCreate = {
      pageId: childPage.id,
      permissionLevel: 'full_access',
      spaceId: space.id
    };

    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(oldPermission)
      .expect(201));

    const nestedChildPageWithPermissions = (await getPage(nestedChildPage.id)) as IPageWithPermissions;

    // Only 1 default permission
    expect(nestedChildPageWithPermissions.parentId).toBe(childPage.id);
    expect(nestedChildPageWithPermissions.permissions.length).toBe(1);
    expect(nestedChildPageWithPermissions.permissions[0].inheritedFromPermission).toBe(rootPage.permissions[0].id);
  });
});
