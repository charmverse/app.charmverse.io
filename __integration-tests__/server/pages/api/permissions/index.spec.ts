import type { Role, Space, User } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import type { IPagePermissionToCreate } from 'lib/permissions/pages';
import { upsertPermission } from 'lib/permissions/pages';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createPage, generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user: LoggedInUser;
let userCookie: string;
let space: Space;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);
  user = generated.user;
  space = generated.space;
  userCookie = await loginUser(user.id);
  role = await generateRole({
    createdBy: user.id,
    spaceId: space.id
  });
});

describe('POST /api/permissions - Add page permissions', () => {

  it('should add a permission if the user is creating a permission and has the grant_permissions operation and respond 201', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await upsertPermission(page.id, {
      // Can only toggle public
      permissionLevel: 'full_access',
      userId: user.id
    });

    const permission: IPagePermissionToCreate = {
      permissionLevel: 'view',
      pageId: page.id,
      roleId: role.id
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', userCookie)
      .send(permission)
      .expect(201);
  });

  it('should add a permission if the user is creating a public permission and has the edit_isPublic operation and respond 201', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.pagePermission.create({
      data: {

        permissionLevel: 'custom',
        permissions: ['edit_isPublic'],
        user: {
          connect: {
            id: user.id
          }
        },
        page: {
          connect: {
            id: page.id
          }
        }
      }
    });

    const permission: IPagePermissionToCreate = {
      permissionLevel: 'view',
      pageId: page.id,
      public: true
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', userCookie)
      .send(permission)
      .expect(201);
  });

  it('should fail if the user is creating a permission without grant_permissions operation and respond 401', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.pagePermission.create({
      data: {

        permissionLevel: 'custom',
        permissions: ['edit_isPublic'],
        user: {
          connect: {
            id: user.id
          }
        },
        page: {
          connect: {
            id: page.id
          }
        }
      }
    });

    const permission: IPagePermissionToCreate = {
      permissionLevel: 'view',
      pageId: page.id,
      roleId: role.id
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', userCookie)
      .send(permission)
      .expect(401);
  });

  it('should fail if trying to manually assign the proposal editor value and respond 401', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await upsertPermission(page.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const permission: IPagePermissionToCreate = {
      permissionLevel: 'proposal_editor',
      pageId: page.id,
      roleId: role.id
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', userCookie)
      .send(permission)
      .expect(401);
  });

  it('should allow a proposal editor to make a proposal page public and respond 201', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'proposal'
    });

    await upsertPermission(page.id, {
      permissionLevel: 'proposal_editor',
      userId: user.id
    });

    const permission: IPagePermissionToCreate = {
      permissionLevel: 'view',
      pageId: page.id,
      public: true
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', userCookie)
      .send(permission)
      .expect(201);
  });

  it('should fail if trying to provide permissions other than "view" to the public and respond 401', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'page'
    });

    await upsertPermission(page.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const permission: IPagePermissionToCreate = {
      permissionLevel: 'full_access',
      pageId: page.id,
      public: true
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', userCookie)
      .send(permission)
      .expect(401);
  });

  it('should fail if trying to assign permissions other than public to a proposal page and respond 401', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'proposal'
    });

    await upsertPermission(page.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const permission: IPagePermissionToCreate = {
      permissionLevel: 'view_comment',
      pageId: page.id,
      roleId: role.id
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', userCookie)
      .send(permission)
      .expect(401);
  });

  it('should fail if trying to manually assign permissions to children of a proposal page and respond 401', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'proposal'
    });

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'page',
      parentId: page.id
    });

    await upsertPermission(page.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const permission: IPagePermissionToCreate = {
      permissionLevel: 'view_comment',
      pageId: childPage.id,
      roleId: role.id
    };

    await request(baseUrl)
      .post('/api/permissions')
      .set('Cookie', userCookie)
      .send(permission)
      .expect(401);
  });

});

describe('DELETE /api/permissions - Delete page permissions', () => {

  it('should delete a permission if the user has the grant_permissions operation and respond 200', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await upsertPermission(page.id, {
      // Can only toggle public
      permissionLevel: 'full_access',
      userId: user.id
    });

    const permissionToDelete = await upsertPermission(page.id, {
      // Can only toggle public
      permissionLevel: 'view',
      roleId: role.id
    });

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', userCookie)
      .send({
        permissionId: permissionToDelete.id
      })
      .expect(200);
  });

  it('should delete a public permission if the user has the edit_isPublic operation and respond 200', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.pagePermission.create({
      data: {

        permissionLevel: 'custom',
        permissions: ['edit_isPublic'],
        user: {
          connect: {
            id: user.id
          }
        },
        page: {
          connect: {
            id: page.id
          }
        }
      }
    });

    const permissionToDelete = await upsertPermission(page.id, {
      // Can only toggle public
      permissionLevel: 'view',
      public: true
    });

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', userCookie)
      .send({
        permissionId: permissionToDelete.id
      })
      .expect(200);
  });

  it('should fail to delete a permission if the user does not have the grant_permissions operation and respond 401', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.pagePermission.create({
      data: {

        permissionLevel: 'custom',
        permissions: ['edit_isPublic'],
        user: {
          connect: {
            id: user.id
          }
        },
        page: {
          connect: {
            id: page.id
          }
        }
      }
    });

    const permissionToDelete = await upsertPermission(page.id, {
      // Can only toggle public
      permissionLevel: 'view',
      roleId: role.id
    });

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', userCookie)
      .send({
        permissionId: permissionToDelete.id
      })
      .expect(401);
  });

  it('should fail to delete a permission on child pages of a proposal and respond 401', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'proposal'
    });

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'page',
      parentId: page.id
    });

    await upsertPermission(childPage.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const permissionToDelete = await upsertPermission(childPage.id, {
      // Can only toggle public
      permissionLevel: 'view',
      roleId: role.id
    });

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', userCookie)
      .send({
        permissionId: permissionToDelete.id
      })
      .expect(401);
  });

});
