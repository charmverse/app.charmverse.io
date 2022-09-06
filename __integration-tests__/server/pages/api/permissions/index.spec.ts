import { SpacePermissionFlags, SpacePermissionModification, SpacePermissionWithAssignee } from 'lib/permissions/spaces';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createPage, generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import { User, Space, Role } from '@prisma/client';
import { IPagePermissionToCreate, upsertPermission } from 'lib/permissions/pages';
import { prisma } from 'db';

let user: User;
let userCookie: string;
let space: Space;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);
  user = generated.user;
  space = generated.space;
  userCookie = await loginUser(user);
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

});

describe('POST /api/permissions - Add page permissions', () => {

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

  it('should fail to delete a permission if the user does not have the grant_permissions operation and respond 200', async () => {

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

});
