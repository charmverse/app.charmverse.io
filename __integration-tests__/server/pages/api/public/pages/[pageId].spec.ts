import type { Page, Space, User } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import { upsertPermission } from 'lib/permissions/pages';
import { baseUrl } from 'testing/mockApiCall';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: User;
let nonAdminUserSpace: Space;

beforeAll(async () => {
  const generated1 = await generateUserAndSpaceWithApiToken(undefined, false);
  nonAdminUser = generated1.user;
  nonAdminUserSpace = generated1.space;

});

const exampleText = 'Content to compare';

const pagePath = 'page-path';

// These API calls should succeed without needed a user account
describe('GET /api/public/pages/[pageId] - Load public page', () => {
  it('should return the public page if provided the page ID and respond 200', async () => {

    const page = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      contentText: exampleText,
      path: pagePath,
      content: {}
    });

    const publicPermission = await upsertPermission((await page).id, {
      public: true,
      permissionLevel: 'view'
    });

    const foundPage = (await request(baseUrl)
      .get(`/api/public/pages/${page.id}`)
      .expect(200)).body as { page: Page };

    expect(foundPage.page.contentText).toBe(exampleText);

    await prisma.page.delete({
      where: {
        id: page.id
      }
    });
  });

  it('should return the public page if provided the space domain + page path and respond 200', async () => {

    const page = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      contentText: exampleText,
      path: pagePath,
      content: {}
    });

    const publicPermission = await upsertPermission((await page).id, {
      public: true,
      permissionLevel: 'view'
    });

    const foundPage = (await request(baseUrl)
      .get(`/api/public/pages/${nonAdminUserSpace.domain}/${pagePath}`)
      .expect(200)).body as { page: Page };

    expect(foundPage.page.contentText).toBe(exampleText);

    await prisma.page.delete({
      where: {
        id: page.id
      }
    });
  });

  it('should throw a not found error if the page is not public and respond with 404', async () => {
    const page = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      contentText: exampleText,
      path: pagePath,
      content: {}
    });

    await request(baseUrl)
      .get(`/api/public/pages/${page.id}`)
      .expect(404);

    await prisma.page.delete({
      where: {
        id: page.id
      }
    });
  });

});
