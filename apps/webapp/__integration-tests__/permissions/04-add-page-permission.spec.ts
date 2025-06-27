/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import { testUtilsPages } from '@charmverse/core/test';
import type { PageWithPermissions } from '@packages/core/pages';
import type {
  AssignedPagePermission,
  PagePermissionAssignment,
  TargetPermissionGroup
} from '@packages/core/permissions';
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

describe('POST /api/permissions - add new permission', () => {
  it('should add the new permission to a page', async () => {
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

    const permissionToCreate: PagePermissionAssignment = {
      pageId: rootPage.id,
      permission: { assignee: { group: 'user', id: user.id }, permissionLevel: 'editor' }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToCreate).expect(201);

    const rootPageWithPermissions = (await getPage(rootPage.id)) as PageWithPermissions;

    expect(rootPageWithPermissions.permissions.length).toBe(2);

    const userPermissionWasAdded = rootPageWithPermissions.permissions.some((perm) => {
      return perm.userId === user.id && perm.permissionLevel === 'editor';
    });

    expect(userPermissionWasAdded).toBe(true);
  });

  it('should add the new permission to the child pages', async () => {
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
    ).body as PageWithPermissions;

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
    ).body as PageWithPermissions;

    const permissionToUpsert: PagePermissionAssignment = {
      pageId: rootPage.id,
      permission: { assignee: { group: 'user', id: user.id }, permissionLevel: 'view' }
    };

    const newPermission = (
      await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToUpsert).expect(201)
    ).body as AssignedPagePermission;

    const childPageList = (await Promise.all([
      testUtilsPages.getPageWithPermissions(childPage.id),
      testUtilsPages.getPageWithPermissions(nestedChildPage.id)
    ])) as PageWithPermissions[];

    childPageList.forEach((childPageWithPermissions) => {
      expect(childPageWithPermissions.permissions.length).toBe(2);

      // Ensure inheritance happened correctly
      const childInheritedPermissions = childPageWithPermissions.permissions.some((perm) => {
        return (
          perm.userId === (newPermission.assignee as TargetPermissionGroup<'user'>).id &&
          perm.permissionLevel === newPermission.permissionLevel &&
          perm.inheritedFromPermission === newPermission.id
        );
      });

      expect(childInheritedPermissions).toBe(true);
    });
  });

  it('should not add the new permission to the child pages if they do not have at least the same level of permissions as the page before the new permission was added', async () => {
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
    ).body as PageWithPermissions;

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
    ).body as PageWithPermissions;

    // Delete all child page permissions
    await Promise.all(
      childPage.permissions.map((perm) => {
        return request(baseUrl)
          .delete('/api/permissions')
          .set('Cookie', cookie)
          .query({
            permissionId: perm.id
          })
          .expect(200);
      })
    );

    // Add a new page level permission
    const permissionToUpsert: PagePermissionAssignment = {
      pageId: rootPage.id,
      permission: { assignee: { group: 'user', id: user.id }, permissionLevel: 'view' }
    };
    await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToUpsert).expect(201);

    const childPageList = (await Promise.all([
      getPage(childPage.id),
      getPage(nestedChildPage.id)
    ])) as PageWithPermissions[];

    childPageList.forEach((childPageWithPermissions) => {
      // No new permissions should have been inherited
      expect(childPageWithPermissions.permissions.length).toBe(0);
    });
  });
});
