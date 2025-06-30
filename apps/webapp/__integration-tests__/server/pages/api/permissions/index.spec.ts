import type { Role, Space } from '@charmverse/core/prisma';
import type { User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import type { PagePermissionAssignment } from '@packages/core/permissions';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

let user: User;
let userCookie: string;
let space: Space;
let role: Role;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: false
  });
  user = generated.user;
  space = generated.space;
  userCookie = await loginUser(user.id);
  role = await testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: space.id
  });
});

describe('POST /api/permissions - Add page permissions', () => {
  it('should add a permission if the user is creating a permission and has the grant_permissions operation and respond 201', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'user', id: user.id }
        }
      ]
    });

    const permission: PagePermissionAssignment = {
      pageId: page.id,
      permission: {
        permissionLevel: 'view',
        assignee: { group: 'role', id: role.id }
      }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', userCookie).send(permission).expect(201);
  });

  it('should add a permission if the user is creating a public permission and has the grant_permissions operation and respond 201', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'user', id: user.id }
        }
      ]
    });

    const permission: PagePermissionAssignment = {
      pageId: page.id,
      permission: {
        permissionLevel: 'view',
        assignee: { group: 'public' }
      }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', userCookie).send(permission).expect(201);
  });

  it('should fail if the user is creating a permission without grant_permissions operation and respond 401', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.pagePermission.create({
      data: {
        permissionLevel: 'custom',
        permissions: ['edit_content'],
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

    const permission: PagePermissionAssignment = {
      pageId: page.id,
      permission: {
        permissionLevel: 'view',
        assignee: { group: 'role', id: role.id }
      }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', userCookie).send(permission).expect(401);
  });

  it('should not allow a proposal editor to make a proposal page public and respond 401', async () => {
    const page = await testUtilsProposals.generateProposal({
      userId: user.id,
      spaceId: space.id
    });

    const permission: PagePermissionAssignment = {
      pageId: page.id,
      permission: {
        permissionLevel: 'view',
        assignee: { group: 'public' }
      }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', userCookie).send(permission).expect(401);
  });

  it('should fail if trying to provide permissions other than "view" to the public and respond 401', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'page',
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'user', id: user.id }
        }
      ]
    });

    const permission: PagePermissionAssignment = {
      pageId: page.id,
      permission: {
        permissionLevel: 'full_access',
        assignee: {
          group: 'public'
        }
      }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', userCookie).send(permission).expect(401);
  });

  it('should fail if trying to assign permissions other than public to a proposal page and respond 401', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'proposal'
    });
    const permission: PagePermissionAssignment = {
      pageId: page.id,
      permission: {
        permissionLevel: 'view_comment',
        assignee: { group: 'role', id: role.id }
      }
    };

    await request(baseUrl).post('/api/permissions').set('Cookie', userCookie).send(permission).expect(401);
  });
});

describe('DELETE /api/permissions - Delete page permissions', () => {
  it('should delete a permission if the user has the grant_permissions operation and respond 200', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'user', id: user.id }
        }
      ]
    });

    const permissionToDelete = await prisma.pagePermission.create({
      data: {
        permissionLevel: 'view',
        page: { connect: { id: page.id } },
        role: { connect: { id: role.id } }
      }
    });

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', userCookie)
      .query({
        permissionId: permissionToDelete.id
      })
      .expect(200);
  });

  it('should delete a public permission if the user has the grant_permissions operation and respond 200', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.pagePermission.create({
      data: {
        permissionLevel: 'full_access',
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

    const permissionToDelete = await prisma.pagePermission.create({
      data: {
        permissionLevel: 'view',
        page: { connect: { id: page.id } },
        public: true
      }
    });

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', userCookie)
      .query({
        permissionId: permissionToDelete.id
      })
      .expect(200);
  });

  it('should fail to delete a permission if the user does not have the grant_permissions operation and respond 401', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.pagePermission.create({
      data: {
        permissionLevel: 'custom',
        permissions: ['edit_content'],
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

    const permissionToDelete = await prisma.pagePermission.create({
      data: {
        permissionLevel: 'view',
        page: { connect: { id: page.id } },
        role: { connect: { id: role.id } }
      }
    });

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', userCookie)
      .query({
        permissionId: permissionToDelete.id
      })
      .expect(401);
  });
});
