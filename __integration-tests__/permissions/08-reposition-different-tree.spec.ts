/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { IPagePermissionToCreate, IPagePermissionWithSource } from 'lib/permissions/pages';
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

describe('PUT /api/pages/{pageId} - reposition page to different tree', () => {

  it('should convert inherited permissions from pages which aren\'t parents anymore to locally defined permissions', async () => {

    let rootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id
      }))
      .expect(201)).body as IPageWithPermissions;

    const permissionToAdd: IPagePermissionToCreate = {
      pageId: rootPage.id,
      permissionLevel: 'view',
      userId: user.id
    };

    // Add permission on child page which will inherit downwards
    const createdRootPermission = (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToAdd)
      .expect(201)
      ).body as IPagePermissionWithSource;

    rootPage = await getPage(rootPage.id) as IPageWithPermissions;

    const rootPage2 = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        title: 'Root page 2'
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

    // Reposition child to separate root 2 tree
    await request(baseUrl)
      .put(`/api/pages/${childPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: childPage.id,
        index: 0,
        parentId: rootPage2.id
      })
      .expect(200);

    const childWithPermissions = await getPage(childPage.id) as IPageWithPermissions;

    const newRootPermissionId = rootPage2.permissions[0].id;

    // Should have kept inherited permissions
    expect(childWithPermissions.permissions.length).toBe(2);

    const hasLocallyDefinedPermission = childWithPermissions.permissions.some(perm => {
      return perm.userId === user.id && perm.inheritedFromPermission === null;
    });

    expect(hasLocallyDefinedPermission).toBe(true);

    const oldParentPermissionIds = rootPage.permissions.map(perm => perm.id);

    const hasPermissionsFromOldParent = childWithPermissions.permissions.some(perm => {
      return oldParentPermissionIds.indexOf(perm.inheritedFromPermission as string) > -1;
    });
    expect(hasPermissionsFromOldParent).toBe(false);
  });

  it('should cascade the new locally defined permissions to the children, and stop these children inheriting from the old parent', async () => {

    let oldRootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id
      }))
      .expect(201)).body as IPageWithPermissions;

    const oldRootSpacePermissionId = oldRootPage.permissions[0].id;

    const permissionToAdd: IPagePermissionToCreate = {
      pageId: oldRootPage.id,
      permissionLevel: 'view',
      userId: user.id
    };

    // Add permission on child page which will inherit downwards
    const createdRootPermission = (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToAdd)
      .expect(201)
    ).body as IPagePermissionWithSource;

    oldRootPage = await getPage(oldRootPage.id) as IPageWithPermissions;

    const newRootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        title: 'Root page 2'
      }))
      .expect(201)).body as IPageWithPermissions;

    const childPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: oldRootPage.id,
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
      .expect(201)).body;

    // Reposition nested child to sibling of child
    await request(baseUrl)
      .put(`/api/pages/${childPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: childPage.id,
        index: 0,
        parentId: newRootPage.id
      })
      .expect(200);

    const [childWithPermissions, nestedChildWithPermissions] = await Promise.all([
      getPage(childPage.id),
      getPage(nestedChildPage.id)
    ]) as IPageWithPermissions[];

    const newRootPermissionId = newRootPage.permissions[0].id;

    // Should have kept inherited permissions
    // Space which is now inherited from new root + user which is defined in children
    expect(childWithPermissions.permissions.length).toBe(2);
    expect(nestedChildWithPermissions.permissions.length).toBe(2);

    // Did we break the chain?
    const nestedInheritsFromOldParent = nestedChildWithPermissions.permissions.some(perm => {
      return perm.inheritedFromPermission === oldRootSpacePermissionId;
    });

    expect(nestedInheritsFromOldParent).toBe(false);
  });

  it('should inherit a permission from the parent if the new parent has the same permission for that permission group', async () => {
    const oldRootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id
      }))
      .expect(201)).body as IPageWithPermissions;

    const oldRootSpacePermissionId = oldRootPage.permissions[0].id;

    const newRootPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        title: 'Root page 2'
      }))
      .expect(201)).body as IPageWithPermissions;

    const childPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: oldRootPage.id,
        title: 'Child'
      }))
      .expect(201)).body as IPageWithPermissions;

    // Reposition nested child to sibling of child
    await request(baseUrl)
      .put(`/api/pages/${childPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: childPage.id,
        index: 0,
        parentId: newRootPage.id
      })
      .expect(200);

    const childWithPermissions = await getPage(childPage.id) as IPageWithPermissions;

    const newRootPermissionId = newRootPage.permissions[0].id;

    // Should now inherit from parent
    expect(childWithPermissions.permissions.length).toBe(1);
    expect(childWithPermissions.permissions[0].inheritedFromPermission).toBe(newRootPermissionId);
  });
});
