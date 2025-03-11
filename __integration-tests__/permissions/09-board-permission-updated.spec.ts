/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageWithPermissions } from '@charmverse/core/pages';
import type { AssignedPagePermission, PagePermissionAssignment } from '@charmverse/core/permissions';
import type { Space } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@packages/profile/getUser';
import { generatePageToCreateStub } from '@packages/testing/generateStubs';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateRole, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
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

describe('POST /api/permissions - create or update board permissions', () => {
  it('should create the new permissions in all the board cards and their children', async () => {
    const boardPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            title: 'Board',
            userId: user.id,
            spaceId: space.id,
            type: 'board'
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    const [childCard1, childCard2, childCard3] = await Promise.all(
      [1, 2, 3].map(async (num) => {
        const response = await request(baseUrl)
          .post('/api/pages')
          .set('Cookie', cookie)
          .send(
            generatePageToCreateStub({
              userId: user.id,
              spaceId: space.id,
              parentId: boardPage.id,
              type: 'card',
              title: `Card ${num}`
            })
          )
          .expect(201);

        return response.body;
      })
    );

    const nestedChildCardPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            title: 'Nested page of child card 1',
            userId: user.id,
            spaceId: space.id,
            type: 'page',
            parentId: childCard1.id
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    const permissionToUpsert: PagePermissionAssignment = {
      pageId: boardPage.id,
      permission: {
        assignee: { group: 'public' },
        permissionLevel: 'view'
      }
    };

    const createdPermission = (
      await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToUpsert).expect(201)
    ).body as AssignedPagePermission;

    const childrenWithPermissions = await Promise.all(
      [childCard1, childCard2, childCard3, nestedChildCardPage].map((card) => {
        return getPage(card.id) as Promise<PageWithPermissions>;
      })
    );

    // Make sure inheritance actually happened
    childrenWithPermissions.forEach((childPage) => {
      expect(
        childPage.permissions.some(
          (p) =>
            p.permissionLevel === createdPermission.permissionLevel &&
            p.public === true &&
            p.inheritedFromPermission === createdPermission.id
        )
      ).toBe(true);
    });
  });

  it('should override the value for existing permissions for the same target group in the board cards and their children', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    const boardPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            type: 'board',
            title: 'Board'
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    const [childCard1, childCard2, childCard3] = await Promise.all(
      [1, 2, 3].map(async (num) => {
        const response = await request(baseUrl)
          .post('/api/pages')
          .set('Cookie', cookie)
          .send(
            generatePageToCreateStub({
              userId: user.id,
              spaceId: space.id,
              parentId: boardPage.id,
              type: 'card',
              title: `Card ${num}`
            })
          )
          .expect(201);

        return response.body;
      })
    );

    const nestedChildCardPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            type: 'page',
            parentId: childCard1.id,
            title: 'Nested page of child card 1'
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    const childPermissionToUpsert: PagePermissionAssignment = {
      pageId: childCard1.id,
      permission: {
        assignee: { group: 'role', id: role.id },
        permissionLevel: 'editor'
      }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(childPermissionToUpsert).expect(201);

    const nestedChildPermissionToUpsert: PagePermissionAssignment = {
      pageId: nestedChildCardPage.id,
      permission: {
        assignee: { group: 'role', id: role.id },
        permissionLevel: 'full_access'
      }
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(nestedChildPermissionToUpsert)
      .expect(201);

    // This will happen at board page level and should be cascaded downwards
    const permissionToUpsert: PagePermissionAssignment = {
      pageId: boardPage.id,
      permission: { assignee: { group: 'role', id: role.id }, permissionLevel: 'view' }
    };

    const createdPermission = (
      await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToUpsert).expect(201)
    ).body as AssignedPagePermission;

    const childrenWithPermissions = await Promise.all(
      [childCard1, childCard2, childCard3, nestedChildCardPage].map((card) => {
        return getPage(card.id) as Promise<PageWithPermissions>;
      })
    );

    // Make sure inheritance actually happened
    childrenWithPermissions.forEach((childPage) => {
      expect(
        childPage.permissions.some(
          (p) =>
            p.permissionLevel === createdPermission.permissionLevel &&
            p.roleId === role.id &&
            p.inheritedFromPermission === createdPermission.id
        )
      ).toBe(true);
    });
  });
});
