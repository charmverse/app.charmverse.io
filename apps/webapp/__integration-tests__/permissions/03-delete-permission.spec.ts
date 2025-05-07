/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
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

describe('DELETE /api/permissions - delete permission', () => {
  it('should delete a permission and all permissions that inherit from it', async () => {
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

    const rootPermissionId = rootPage.permissions[0].id;

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', cookie)
      .query({
        permissionId: rootPermissionId
      })
      .expect(200);

    const remainingPermissions = await prisma.pagePermission.findMany({
      where: {
        OR: [
          {
            id: rootPermissionId
          },
          {
            inheritedFromPermission: rootPermissionId
          }
        ]
      }
    });

    expect(remainingPermissions.length).toBe(0);
  });

  it('should delete an inherited permission from all child pages, but leave the parent pages that inherit this permission untouched', async () => {
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

    const subNestedChildPage = (
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
    ).body as PageWithPermissions;

    const rootPermissionId = rootPage.permissions[0].id;

    const nestedChildPermissionId = nestedChildPage.permissions.find(
      (p) => p.inheritedFromPermission === rootPermissionId
    )?.id as string;

    await request(baseUrl)
      .delete('/api/permissions')
      .set('Cookie', cookie)
      .query({
        permissionId: nestedChildPermissionId
      })
      .expect(200);

    const remainingPermissions = await prisma.pagePermission.findMany({
      where: {
        OR: [
          {
            id: rootPermissionId
          },
          {
            inheritedFromPermission: rootPermissionId
          }
        ]
      }
    });

    expect(remainingPermissions.length).toBe(2);
  });
});
