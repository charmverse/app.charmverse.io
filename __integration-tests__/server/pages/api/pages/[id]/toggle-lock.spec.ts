/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBoard } from '@packages/testing/setupDatabase';
import request from 'supertest';

describe('PUT /api/pages/{id}/toggle-lock - Toggle page lock', () => {
  let admin: User;
  let member: User;
  let memberWithoutPermissions: User;
  let database: Page;
  let space: Space;

  beforeAll(async () => {
    ({ user: admin, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    }));
    member = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    memberWithoutPermissions = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    database = await generateBoard({
      spaceId: space.id,
      createdBy: admin.id
    });

    await prisma.pagePermission.create({
      data: {
        permissionLevel: 'custom',
        permissions: ['edit_lock'],
        user: { connect: { id: member.id } },
        page: { connect: { id: database.id } }
      }
    });
  });

  it('should allow user with edit_lock permissions to change the page lock, responding with 200', async () => {
    const userCookie = await loginUser(member.id);

    await request(baseUrl)
      .put(`/api/pages/${database.id}/toggle-lock`)
      .set('Cookie', userCookie)
      .send({
        isLocked: true
      })
      .expect(200);

    const updatedPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: database.id
      }
    });

    expect(updatedPage.isLocked).toEqual(true);
  });

  it('should not allow a user without edit_lock permissions to change the page lock, responding with 401', async () => {
    const userCookie = await loginUser(memberWithoutPermissions.id);

    await request(baseUrl)
      .put(`/api/pages/${database.id}/toggle-lock`)
      .set('Cookie', userCookie)
      .send({
        isLocked: true
      })
      .expect(401);
  });
});
