/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageWithPermissions } from '@charmverse/core/pages';
import type {
  AssignedPagePermission,
  PagePermissionAssignment,
  PagePermissionWithSource
} from '@charmverse/core/permissions';
import type { Space } from '@charmverse/core/prisma';
import { getPage } from 'lib/pages/server';
import type { LoggedInUser } from '@packages/profile/getUser';
import { generatePageToCreateStub } from '@packages/testing/generateStubs';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateRole, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
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

describe('PUT /api/pages/{pageId} - reposition page to different tree', () => {
  it('should convert inherited permissions from pages which arent parents anymore to locally defined permissions', async () => {
    let rootPage = (
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

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const permissionToAdd: PagePermissionAssignment = {
      pageId: rootPage.id,
      permission: {
        permissionLevel: 'view',
        assignee: { group: 'role', id: role.id }
      }
    };

    // Add permission on child page which will inherit downwards
    const createdRootPermission = (
      await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToAdd).expect(201)
    ).body as AssignedPagePermission;

    rootPage = (await getPage(rootPage.id)) as PageWithPermissions;

    const rootPage2 = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            title: 'Root page 2'
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
    ).body;

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

    const childWithPermissions = (await getPage(childPage.id)) as PageWithPermissions;

    const newRootPermissionId = rootPage2.permissions[0].id;

    // Should have kept inherited permissions (Default space full access + createdBy user full access + role we just added)
    expect(childWithPermissions.permissions.length).toBe(3);

    const hasLocallyDefinedPermission = childWithPermissions.permissions.some((perm) => {
      return perm.roleId === role.id && perm.inheritedFromPermission === null;
    });

    expect(hasLocallyDefinedPermission).toBe(true);

    const oldParentPermissionIds = rootPage.permissions.map((perm) => perm.id);

    const hasPermissionsFromOldParent = childWithPermissions.permissions.some((perm) => {
      return oldParentPermissionIds.indexOf(perm.inheritedFromPermission as string) > -1;
    });
    expect(hasPermissionsFromOldParent).toBe(false);
  });

  it('should cascade the new locally defined permissions to the children, and stop these children inheriting from the old parent', async () => {
    let oldRootPage = (
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

    const oldRootSpacePermissionId = oldRootPage.permissions[0].id;

    const permissionToAdd: PagePermissionAssignment = {
      pageId: oldRootPage.id,
      permission: { assignee: { group: 'user', id: user.id }, permissionLevel: 'view' }
    };

    // Add permission on child page which will inherit downwards
    const createdRootPermission = (
      await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToAdd).expect(201)
    ).body as AssignedPagePermission;

    oldRootPage = (await getPage(oldRootPage.id)) as PageWithPermissions;

    const newRootPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            title: 'Root page 2'
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
            parentId: oldRootPage.id,
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
    ).body;

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

    const [childWithPermissions, nestedChildWithPermissions] = (await Promise.all([
      getPage(childPage.id),
      getPage(nestedChildPage.id)
    ])) as PageWithPermissions[];

    const newRootPermissionId = newRootPage.permissions[0].id;

    // Should have kept inherited permissions
    // Space which is now inherited from new root + user which is defined in children
    expect(childWithPermissions.permissions.length).toBe(2);
    expect(nestedChildWithPermissions.permissions.length).toBe(2);

    // Did we break the chain?
    const nestedInheritsFromOldParent = nestedChildWithPermissions.permissions.some((perm) => {
      return perm.inheritedFromPermission === oldRootSpacePermissionId;
    });

    expect(nestedInheritsFromOldParent).toBe(false);
  });

  it('should inherit a permission from the parent if the new parent has the same permission for that permission group', async () => {
    const oldRootPage = (
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

    const newRootPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            title: 'Root page 2'
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
            parentId: oldRootPage.id,
            title: 'Child'
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

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

    const childWithPermissions = (await getPage(childPage.id)) as PageWithPermissions;

    // Return Space ID permission, which should inherit
    const newRootPermissionId = newRootPage.permissions.find((p) => p.spaceId)?.id;

    // Should now inherit from parent (Base space permission + createdBy user permission)
    expect(childWithPermissions.permissions.length).toBe(2);
    expect(
      childWithPermissions.permissions.find((p) => p.inheritedFromPermission === (newRootPermissionId as string))
    ).toBeDefined();
  });

  /**
   * This test was added to deal with a case where moving pages around the tree created a phantom inheritance for a permission that should be locally defined.
   *
   * Setup: Create Root, Child 1, Child 1.1, Child 1.1.1
   * Add User / view on child 1.1
   * Make Child 1 root (which brings along child 1.1 and 1.1.1
   * Put child 1 back under root page
   *
   * Child 1.1's permission was appearing as inherited from Root, even though it should be locally defined.
   *
   * The fix was inside upsert permission, however this test has been added to protect against this case.
   *
   */
  it('should not insert phantom inheritance', async () => {
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

    const childPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            parentId: rootPage.id,
            title: 'Child 1'
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
    ).body;

    const superNestedChildPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            parentId: nestedChildPage.id,
            title: 'Nested'
          })
        )
        .expect(201)
    ).body;

    const permissionToAdd: PagePermissionAssignment = {
      pageId: nestedChildPage.id,
      permission: {
        assignee: { group: 'user', id: user.id },
        permissionLevel: 'view'
      }
    };

    // Add permission on child page which will inherit downwards
    const createdNestedChildPermission = (
      await request(baseUrl).post('/api/permissions').set('Cookie', cookie).send(permissionToAdd).expect(201)
    ).body as PagePermissionWithSource;

    // Move subtree out to root
    await request(baseUrl)
      .put(`/api/pages/${childPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: childPage.id,
        index: 0,
        parentId: null
      })
      .expect(200);

    // Move subtree back to tree
    await request(baseUrl)
      .put(`/api/pages/${childPage.id}`)
      .set('Cookie', cookie)
      .send({
        id: childPage.id,
        index: 0,
        parentId: rootPage.id
      })
      .expect(200);

    const nestedChildWithPermissions = (await getPage(nestedChildPage.id)) as PageWithPermissions;

    expect(nestedChildWithPermissions.permissions.length).toBe(2);

    const userPermissionLocallyDefined = nestedChildWithPermissions.permissions.some((perm) => {
      return perm.userId === user.id && perm.inheritedFromPermission === null;
    });
    expect(userPermissionLocallyDefined).toBe(true);
  });
});
