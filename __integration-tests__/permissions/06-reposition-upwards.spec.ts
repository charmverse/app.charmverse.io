/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
import type { IPagePermissionToCreate, IPagePermissionWithSource } from 'lib/permissions/pages';
import type { LoggedInUser } from 'models';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user: LoggedInUser;
let space: Space;
let cookie: string;

// jest.setTimeout(1000000);

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());

  user = generated.user;
  space = generated.space;
  cookie = await loginUser(user.id);

});

describe('PUT /api/pages/{pageId} - reposition page upwards', () => {

  it('should convert inherited permissions from pages which aren\'t parents anymore to locally defined permissions', async () => {

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

    const permissionToAdd: IPagePermissionToCreate = {
      pageId: childPage.id,
      permissionLevel: 'view',
      userId: user.id
    };

    // Add permission on child page which will inherit downwards
    const createdChildPermission = (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToAdd)
      .expect(201)).body as IPagePermissionWithSource;

    // Reposition nested child to sibling of child
    await request(baseUrl)
      .put(`/api/pages/${nestedChildPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: nestedChildPage.id,
        index: 0,
        parentId: rootPage.id
      })
      .expect(200);

    const nestedChildWithPermissions = await getPage(nestedChildPage.id) as IPageWithPermissions;

    // Should have kept inherited permissions
    expect(nestedChildWithPermissions.permissions.length).toBe(2);
    expect(nestedChildWithPermissions.permissions.every(perm => perm.inheritedFromPermission === createdChildPermission.id)).toBe(false);
  });

  it('should cascade the new locally defined permissions to the children', async () => {

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
        parentId: rootPage.id,
        title: 'Child'
      }))
      .expect(201)).body;

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

    const superNestedChildPage = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', cookie)
      .send(generatePageToCreateStub({
        userId: user.id,
        spaceId: space.id,
        parentId: nestedChildPage.id,
        title: 'Super nested'
      }))
      .expect(201)).body;

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const permissionToAdd: IPagePermissionToCreate = {
      pageId: childPage.id,
      permissionLevel: 'view',
      roleId: role.id
    };

    // Add permission on child page which will inherit downwards
    const createdChildPermission = (await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', cookie)
      .send(permissionToAdd)
      .expect(201)
      ).body as IPagePermissionWithSource;

    // Reposition nested child to sibling of child
    await request(baseUrl)
      .put(`/api/pages/${nestedChildPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: nestedChildPage.id,
        index: 0,
        parentId: rootPage.id
      });

    const [rootPageWithPermissions, nestedChildWithPermissions, superNestedChildWithPermissions] = (await Promise.all([
      getPage(rootPage.id),
      getPage(nestedChildPage.id),
      getPage(superNestedChildPage.id)
    ])) as IPageWithPermissions[];

    const rootPagePermissionId = rootPageWithPermissions.permissions[0].id;

    // Should have same count of permissions as root plus the new one (default space + default creating user + the child one that was assigned)
    expect(nestedChildWithPermissions.permissions.length).toBe(rootPageWithPermissions.permissions.length + 1);

    // Make sure nested and child inheritance is broken
    const nestedInheritsFromChild = nestedChildWithPermissions.permissions.some(
      perm => perm.inheritedFromPermission === createdChildPermission.id
    );
    expect(nestedInheritsFromChild).toBe(false);

    // Make sure nested still inherits from root
    const nestedInheritsFromRoot = nestedChildWithPermissions.permissions.some(
      perm => perm.inheritedFromPermission === rootPagePermissionId
    );
    expect(nestedInheritsFromRoot).toBe(true);

    // A locally defined permission in child is now defined locally in nested since nested is a sibling of child and shouldn't inherit from child anymore
    const locallyDefinedNestedPermission = nestedChildWithPermissions.permissions.find(perm => perm.inheritedFromPermission === null);

    expect(locallyDefinedNestedPermission).toBeDefined();

    // Super nested child now inherits one permission from nested
    expect(superNestedChildWithPermissions.permissions.length).toBe(rootPageWithPermissions.permissions.length + 1);

    const superNestedInheritsFromNested = superNestedChildWithPermissions.permissions.some(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      perm => perm.inheritedFromPermission === locallyDefinedNestedPermission!.id
    );
    expect(superNestedInheritsFromNested).toBe(true);

    const superNestedInheritsFromRoot = superNestedChildWithPermissions.permissions.some(
      perm => perm.inheritedFromPermission === rootPagePermissionId
    );
    expect(superNestedInheritsFromRoot).toBe(true);

  });

});
