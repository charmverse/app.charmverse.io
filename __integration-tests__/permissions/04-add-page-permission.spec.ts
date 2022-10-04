/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PagePermission, Space, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
import type { IPagePermissionToCreate } from 'lib/permissions/pages';
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

describe('POST /api/permissions - add new permission', () => {

  it('should add the new permission to a page', async () => {

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

    const rootPageWithPermissions = (await getPage(rootPage.id)) as IPageWithPermissions;

    expect(rootPageWithPermissions.permissions.length).toBe(2);

    const userPermissionWasAdded = rootPageWithPermissions.permissions.some(perm => {
      return perm.userId === user.id && perm.permissionLevel === 'editor';
    });

    expect(userPermissionWasAdded).toBe(true);

  });

  it('should add the new permission to the child pages', async () => {

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
      pageId: rootPage.id,
      permissionLevel: 'view',
      userId: user.id
    };

    const newPermission = (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201)).body as PagePermission;

    const childPageList = await Promise.all([
      getPage(childPage.id),
      getPage(nestedChildPage.id)
    ]) as IPageWithPermissions [];

    childPageList.forEach(childPageWithPermissions => {

      expect(childPageWithPermissions.permissions.length).toBe(2);

      // Ensure inheritance happened correctly
      const childInheritedPermissions = childPageWithPermissions.permissions.some(perm => {
        return (perm.userId === newPermission.userId
          && perm.permissionLevel === newPermission.permissionLevel
          && perm.inheritedFromPermission === newPermission.id);
      });

      expect(childInheritedPermissions).toBe(true);
    });

  });

  it('should not add the new permission to the child pages if they do not have at least the same level of permissions as the page before the new permission was added', async () => {

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

    // Delete all child page permissions
    await Promise.all(childPage.permissions.map(perm => {
      return request(baseUrl)
        .delete('/api/permissions')
        .set('Cookie', cookie)
        .send({
          permissionId: perm.id
        })
        .expect(200);
    }));

    // Add a new page level permission
    const permissionToUpsert: IPagePermissionToCreate = {
      pageId: rootPage.id,
      permissionLevel: 'view',
      userId: user.id
    };

    const newPermission = (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201)).body as PagePermission;

    const childPageList = await Promise.all([
      getPage(childPage.id),
      getPage(nestedChildPage.id)
    ]) as IPageWithPermissions [];

    childPageList.forEach(childPageWithPermissions => {

      // No new permissions should have been inherited
      expect(childPageWithPermissions.permissions.length).toBe(0);
    });

  });
});
