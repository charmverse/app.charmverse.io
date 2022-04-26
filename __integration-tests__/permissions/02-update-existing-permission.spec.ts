/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { IPagePermissionToCreate, IPagePermissionWithSource } from 'lib/permissions/pages';
import { getPage, IPageWithPermissions } from 'lib/pages/server';

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

describe('POST /api/permissions - update permissions', () => {

  it('should replace an existing permission with the same pageId and user/space/role link', async () => {

    const rootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id
      }))
      .expect(201)).body as IPageWithPermissions;

    const permissionToCreate: IPagePermissionToCreate = {
      pageId: rootPage.id,
      permissionLevel: 'editor',
      userId: user.id
    };

    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToCreate)
      .expect(201));

    const permissionToUpsert: IPagePermissionToCreate = {
      pageId: rootPage.id,
      permissionLevel: 'view',
      userId: user.id
    };

    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201));

    const rootPageWithPermissions = (await getPage(rootPage.id)) as IPageWithPermissions;

    // Only 1 default permission
    expect(rootPageWithPermissions.permissions.length).toBe(2);

    const hasUserPermissionWithLatestUpdate = rootPageWithPermissions.permissions.some(perm => {
      return perm.userId === user.id && perm.permissionLevel === 'view';
    });
    expect(hasUserPermissionWithLatestUpdate).toBe(true);
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

    const permissionToAdd: IPagePermissionToCreate = {
      pageId: rootPage.id,
      permissionLevel: 'view',
      userId: user.id
    };

    // Add second permission to the page
    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToAdd)
      .expect(201));

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

    // Update level in child page so it becomes locally defined
    const permissionToUpsert: IPagePermissionToCreate = {
      pageId: childPage.id,
      permissionLevel: 'editor',
      userId: user.id
    };

    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201));

    // Set child page back to same level as parent
    const oldPermission: IPagePermissionToCreate = {
      pageId: childPage.id,
      permissionLevel: 'view',
      userId: user.id
    };

    (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(oldPermission)
      .expect(201));

    const [rootPageWithPermissions, nestedChildPageWithPermissions] = await Promise.all([
      getPage(rootPage.id),
      getPage(nestedChildPage.id)
    ]) as IPageWithPermissions[];

    const rootPermission = rootPageWithPermissions.permissions.find(perm => {
      return perm.userId === user.id;
    }) as IPagePermissionWithSource;

    expect(nestedChildPageWithPermissions.permissions.length).toBe(2);

    const nestedInheritsUserPermissionFromRoot = nestedChildPageWithPermissions.permissions.some(perm => {
      return perm.inheritedFromPermission === rootPermission.id && perm.userId === user.id;
    });

    expect(nestedInheritsUserPermissionFromRoot).toBe(true);
  });
});
