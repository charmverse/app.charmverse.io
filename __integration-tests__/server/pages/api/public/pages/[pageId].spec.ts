import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { baseUrl } from '@packages/testing/mockApiCall';
import request from 'supertest';

let nonAdminUser: User;
let nonAdminUserSpace: Space;

beforeAll(async () => {
  const generated1 = await testUtilsUser.generateUserAndSpace({
    isAdmin: false
  });
  nonAdminUser = generated1.user;
  nonAdminUserSpace = generated1.space;
});

const exampleText = 'Content to compare';

const pagePath = 'page-path';

// These API calls should succeed without needed a user account
describe('GET /api/public/pages/[pageId] - Load public page', () => {
  it('should return the public page if provided the page ID and respond 200', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      contentText: exampleText,
      path: pagePath,
      content: null,
      pagePermissions: [
        {
          permissionLevel: 'view',
          assignee: { group: 'public' }
        }
      ]
    });
    const foundPage = (await request(baseUrl).get(`/api/public/pages/${page.id}`).expect(200)).body as { page: Page };

    expect(foundPage.page.contentText).toBe(exampleText);

    await prisma.page.delete({
      where: {
        id: page.id
      }
    });
  });

  it('should return the public page if provided the space domain + page path and respond 200', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      contentText: exampleText,
      path: pagePath,
      content: null,
      pagePermissions: [
        {
          permissionLevel: 'view',
          assignee: { group: 'public' }
        }
      ]
    });

    const foundPage = (
      await request(baseUrl).get(`/api/public/pages/${nonAdminUserSpace.domain}/${pagePath}`).expect(200)
    ).body as { page: Page };

    expect(foundPage.page.contentText).toBe(exampleText);

    await prisma.page.delete({
      where: {
        id: page.id
      }
    });
  });

  it('should throw a not found error if the page is not public and respond with 404', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      contentText: exampleText,
      path: pagePath,
      content: null
    });

    await request(baseUrl).get(`/api/public/pages/${page.id}`).expect(404);

    await prisma.page.delete({
      where: {
        id: page.id
      }
    });
  });

  it('should fail if the page contains unsafe content and respond with 401', async () => {
    const unsafePageContent = {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          attrs: { emoji: '😃', track: [] },
          content: [
            {
              type: 'heading',
              attrs: { id: null, level: 2, track: [] },
              content: [
                {
                  text: 'www.unsafe.ru',
                  type: 'text'
                }
              ]
            }
          ]
        }
      ]
    };

    const page = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: nonAdminUserSpace.id,
      contentText: exampleText,
      path: pagePath,
      content: unsafePageContent,
      pagePermissions: [
        {
          assignee: { group: 'public' },
          permissionLevel: 'view'
        }
      ]
    });

    await request(baseUrl).get(`/api/public/pages/${page.id}`).expect(401);

    await prisma.page.delete({
      where: {
        id: page.id
      }
    });
  });
});
