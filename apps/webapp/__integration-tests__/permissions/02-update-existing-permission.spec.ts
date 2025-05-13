/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageWithPermissions } from '@charmverse/core/pages';
import type { PagePermissionAssignment, PagePermissionWithSource } from '@charmverse/core/permissions';
import type { Space } from '@charmverse/core/prisma';
import { getPage } from 'lib/pages/server';
import type { LoggedInUser } from '@packages/profile/getUser';
import { generatePageToCreateStub } from '@packages/testing/generateStubs';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';

let user: LoggedInUser;
let space: Space;
let cookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();

  user = generated.user;
  space = generated.space;
  cookie = await loginUser(user.id);
});

describe('POST /api/permissions - update permissions', () => {
  it('should replace an existing permission with the same pageId and user/space/role link', async () => {
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

    const permissionToUpsert: PagePermissionAssignment = {
      pageId: rootPage.id,
      permission: { assignee: { group: 'user', id: user.id }, permissionLevel: 'view' }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToUpsert).expect(201);

    const rootPageWithPermissions = (await getPage(rootPage.id)) as PageWithPermissions;

    // Only 1 default permission
    expect(rootPageWithPermissions.permissions.length).toBe(2);

    const hasUserPermissionWithLatestUpdate = rootPageWithPermissions.permissions.some((perm) => {
      return perm.userId === user.id && perm.permissionLevel === 'view';
    });
    expect(hasUserPermissionWithLatestUpdate).toBe(true);
  });

  it('should cascade an updated permission down to the children, and make the page the authority for that permission (as long as it is different from the page parent)', async () => {
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
      pageId: childPage.id,
      permission: { assignee: { group: 'space', id: space.id }, permissionLevel: 'view' }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToUpsert).expect(201);

    const childPageSpacePermission = childPage.permissions.find((p) => p.spaceId) as PagePermissionWithSource;

    const nestedChildPageWithPermissions = (await getPage(nestedChildPage.id)) as PageWithPermissions;

    // 2 permissions, base space + default full access for creator
    expect(nestedChildPageWithPermissions.parentId).toBe(childPage.id);
    expect(nestedChildPageWithPermissions.permissions.length).toBe(2);
    expect(nestedChildPageWithPermissions.permissions.find((p) => p.spaceId)?.inheritedFromPermission).toBe(
      childPageSpacePermission.id
    );
  });

  it('should re-establish inheritance if a page permission is set to the same value as a parent page, and cascade this down to its children', async () => {
    const rootPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            title: 'Root'
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    const permissionToAdd: PagePermissionAssignment = {
      pageId: rootPage.id,
      permission: { assignee: { group: 'user', id: user.id }, permissionLevel: 'view' }
    };

    // Add second permission to the page
    await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToAdd).expect(201);

    const childPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            parentId: rootPage.id,
            title: 'Child'
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
            parentId: childPage.id,
            title: 'Nested'
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    // Update level in child page so it becomes locally defined
    const permissionToUpsert: PagePermissionAssignment = {
      pageId: childPage.id,
      permission: { assignee: { group: 'user', id: user.id }, permissionLevel: 'editor' }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToUpsert).expect(201);

    // Set child page back to same level as parent
    const oldPermission: PagePermissionAssignment = {
      pageId: childPage.id,
      permission: { assignee: { group: 'user', id: user.id }, permissionLevel: 'view' }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(oldPermission).expect(201);

    const [rootPageWithPermissions, nestedChildPageWithPermissions] = (await Promise.all([
      getPage(rootPage.id),
      getPage(nestedChildPage.id)
    ])) as PageWithPermissions[];

    const rootPermission = rootPageWithPermissions.permissions.find((perm) => {
      return perm.userId === user.id;
    }) as PagePermissionWithSource;

    expect(nestedChildPageWithPermissions.permissions.length).toBe(2);

    const nestedInheritsUserPermissionFromRoot = nestedChildPageWithPermissions.permissions.some((perm) => {
      return perm.inheritedFromPermission === rootPermission.id && perm.userId === user.id;
    });

    expect(nestedInheritsUserPermissionFromRoot).toBe(true);
  });
});
