/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageWithPermissions } from '@charmverse/core/pages';
import type { PagePermission, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@packages/profile/getUser';
import { generatePageToCreateStub } from '@packages/testing/generateStubs';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { isTruthy } from '@packages/utils/types';
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

describe('POST /api/pages - create child pages', () => {
  it('should assign the permissions of the parent to the child', async () => {
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
            title: 'Child',
            parentId: rootPage.id
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    // Only 1 default permission
    expect(childPage.parentId).toBe(rootPage.id);
    expect(childPage.permissions.length).toBe(2);

    const sourcePermissionIds = rootPage.permissions.map((p) => p.id);
    expect(sourcePermissionIds.indexOf(childPage.permissions[0].inheritedFromPermission as string) >= 0).toBe(true);
  });

  it('should forward inherited permission references to nested children', async () => {
    const createdPage = (
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
            parentId: createdPage.id
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

    // Base space permission plus createdBy user full access permission
    expect(nestedChildPage.permissions.length).toBe(2);

    const sourcePermissionIds = createdPage.permissions.map((p) => p.id);
    expect(sourcePermissionIds.indexOf(childPage.permissions[0].inheritedFromPermission as string) >= 0).toBe(true);
    expect(sourcePermissionIds.indexOf(nestedChildPage.permissions[0].inheritedFromPermission as string) >= 0).toBe(
      true
    );
  });

  it('should clean up any illegal permission inheritance references', async () => {
    const createdPage = (
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

    let childPage = (
      await request(baseUrl)
        .post('/api/pages')
        .set('Cookie', cookie)
        .send(
          generatePageToCreateStub({
            userId: user.id,
            spaceId: space.id,
            parentId: createdPage.id
          })
        )
        .expect(201)
    ).body as PageWithPermissions;

    const separateRoot = (
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

    // Inject bad permissions by updating space level and created by permissions to inherit from the separate root
    for (const permission of childPage.permissions) {
      const matchingPermission = separateRoot.permissions.find((p) => {
        if (permission.spaceId) {
          // Same space ID
          return p.spaceId === permission.spaceId;
        } else {
          // User ID defined
          return isTruthy(p.userId) && isTruthy(permission.userId);
        }
      }) as PagePermission;

      await prisma.pagePermission.update({
        where: {
          id: permission.id
        },
        data: {
          sourcePermission: {
            connect: {
              id: matchingPermission.id
            }
          }
        }
      });
    }

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

    // Refresh the child page
    childPage = (await getPage(childPage.id)) as PageWithPermissions;

    const sourcePermissionIds = createdPage.permissions.map((p) => p.id);

    // Adding the new permission should have updated the old one
    expect(
      childPage.permissions.every((p) => sourcePermissionIds.indexOf(p.inheritedFromPermission as string) >= 0)
    ).toBe(true);
    expect(
      nestedChildPage.permissions.every((p) => sourcePermissionIds.indexOf(p.inheritedFromPermission as string) >= 0)
    ).toBe(true);
  });
});
