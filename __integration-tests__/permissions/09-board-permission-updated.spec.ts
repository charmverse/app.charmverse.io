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
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user: LoggedInUser;
let space: Space;
let cookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());

  user = generated.user;
  space = generated.space;
  cookie = await loginUser(user.id);

});

describe('POST /api/permissions - create or update board permissions', () => {

  it('should create the new permissions in all the board cards and their children', async () => {

    const boardPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        title: 'Board',
        userId: user.id,
        spaceId: space.id,
        type: 'board'
      }))
      .expect(201)).body as IPageWithPermissions;

    const [childCard1, childCard2, childCard3] = await Promise.all([1, 2, 3].map(async num => {
      const response = await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(generatePageToCreateStub({
          userId: user.id,
          spaceId: space.id,
          parentId: boardPage.id,
          type: 'card',
          title: `Card ${num}`
        }))
        .expect(201);

      return response.body;
    }));

    const nestedChildCardPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        title: 'Nested page of child card 1',
        userId: user.id,
        spaceId: space.id,
        type: 'page',
        parentId: childCard1.id
      }))
      .expect(201)).body as IPageWithPermissions;

    const permissionToUpsert: IPagePermissionToCreate = {
      pageId: boardPage.id,
      permissionLevel: 'view',
      public: true
    };

    const createdPermission = (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201)).body as PagePermission;

    const childrenWithPermissions = await Promise.all([childCard1, childCard2, childCard3, nestedChildCardPage].map(card => {
      return getPage(card.id) as Promise<IPageWithPermissions>;
    }));

    // Make sure inheritance actually happened
    childrenWithPermissions.forEach(childPage => {
      expect(childPage.permissions.some(p => p.permissionLevel === createdPermission.permissionLevel
        && p.public === true
        && p.inheritedFromPermission === createdPermission.id)).toBe(true);
    });

  });

  it('should override the value for existing permissions for the same target group in the board cards and their children', async () => {

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    const boardPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        type: 'board',
        title: 'Board'
      }))
      .expect(201)).body as IPageWithPermissions;

    const [childCard1, childCard2, childCard3] = await Promise.all([1, 2, 3].map(async num => {
      const response = await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(generatePageToCreateStub({
          userId: user.id,
          spaceId: space.id,
          parentId: boardPage.id,
          type: 'card',
          title: `Card ${num}`
        }))
        .expect(201);

      return response.body;
    }));

    const nestedChildCardPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        type: 'page',
        parentId: childCard1.id,
        title: 'Nested page of child card 1'
      }))
      .expect(201)).body as IPageWithPermissions;

    const childPermissionToUpsert: IPagePermissionToCreate = {
      pageId: childCard1.id,
      permissionLevel: 'editor',
      roleId: role.id
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(childPermissionToUpsert)
      .expect(201);

    const nestedChildPermissionToUpsert: IPagePermissionToCreate = {
      pageId: nestedChildCardPage.id,
      permissionLevel: 'full_access',
      roleId: role.id
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(nestedChildPermissionToUpsert)
      .expect(201);

    // This will happen at board page level and should be cascaded downwards
    const permissionToUpsert: IPagePermissionToCreate = {
      pageId: boardPage.id,
      permissionLevel: 'view',
      roleId: role.id
    };

    const createdPermission = (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToUpsert)
      .expect(201)).body as PagePermission;

    const childrenWithPermissions = await Promise.all([childCard1, childCard2, childCard3, nestedChildCardPage].map(card => {
      return getPage(card.id) as Promise<IPageWithPermissions>;
    }));

    // Make sure inheritance actually happened
    childrenWithPermissions.forEach(childPage => {
      expect(childPage.permissions.some(p => p.permissionLevel === createdPermission.permissionLevel
        && p.roleId === role.id
        && p.inheritedFromPermission === createdPermission.id)).toBe(true);
    });

  });

});
