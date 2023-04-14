/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@charmverse/core';
import type { Page } from '@prisma/client';
import request from 'supertest';

import type { IPageWithPermissions } from 'lib/pages';
import { getPagePath } from 'lib/pages';
import { createProposalTemplate } from 'lib/templates/proposals/createProposalTemplate';
import { generatePageNode } from 'testing/generateStubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpace, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

const updateContent = {
  content: {
    paragraph: 'This is a paragraph'
  }
};

describe('PUT /api/pages/{id} - update page', () => {
  it('should allow user with permissions to update the page content, title, header image, and icon', async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: false });

    const page = await prisma.page.create({
      data: {
        title: 'Page 1',
        type: 'page',
        updatedBy: user.id,
        author: { connect: { id: user.id } },
        space: { connect: { id: space.id } },
        path: getPagePath(),
        contentText: '',
        content: {},
        permissions: {
          create: {
            permissionLevel: 'full_access',
            space: { connect: { id: space.id } }
          }
        }
      }
    });
    const userCookie = await loginUser(user.id);

    const pageUpdate: Pick<Page, 'title' | 'headerImage' | 'icon' | 'content' | 'contentText'> = {
      content: { paragraph: 'This is a paragraph' },
      contentText: 'This is a paragraph',
      headerImage: 'https://example.com/image.png',
      icon: 'https://example.com/icon.png',
      title: 'new title'
    };

    const body = (
      await request(baseUrl).put(`/api/pages/${page.id}`).set('Cookie', userCookie).send(pageUpdate).expect(200)
    ).body as IPageWithPermissions;

    expect(body).toMatchObject(expect.objectContaining(pageUpdate));
  });

  // This is a temporary test, until we get a more fine grained way to evaluate diffs received in content field
  it('should not allow user with view_comment permission or less to update any other field than the page content', async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: false });

    const page = await prisma.page.create({
      data: {
        title: 'Page 1',
        type: 'page',
        updatedBy: user.id,
        author: { connect: { id: user.id } },
        space: { connect: { id: space.id } },
        path: getPagePath(),
        contentText: '',
        content: {},
        permissions: {
          create: {
            permissionLevel: 'view_comment',
            space: { connect: { id: space.id } }
          }
        }
      }
    });
    const userCookie = await loginUser(user.id);
    // This isn't the exact shape of a comment mark, but it's enough to test the functionality
    const commentUpdate: Pick<Page, 'content' | 'contentText'> = {
      content: { paragraph: 'This is a paragraph', marks: ['commentMark'] },
      contentText: 'This is a paragraph [commentMark]'
    };

    const body = (
      await request(baseUrl).put(`/api/pages/${page.id}`).set('Cookie', userCookie).send(commentUpdate).expect(200)
    ).body as IPageWithPermissions;
    expect(body).toMatchObject(expect.objectContaining(commentUpdate));

    const titleUpdate: Pick<Page, 'title'> = {
      title: 'new title'
    };

    const iconUpdate: Pick<Page, 'icon'> = {
      icon: 'https://example.com/icon.png'
    };

    const headerUpdate: Pick<Page, 'headerImage'> = {
      headerImage: 'https://example.com/image.png'
    };
    await request(baseUrl).put(`/api/pages/${page.id}`).set('Cookie', userCookie).send(titleUpdate).expect(401);
    await request(baseUrl).put(`/api/pages/${page.id}`).set('Cookie', userCookie).send(iconUpdate).expect(401);
    await request(baseUrl).put(`/api/pages/${page.id}`).set('Cookie', userCookie).send(headerUpdate).expect(401);
  });

  it('should update proposal template page content if the user is an admin and respond 200', async () => {
    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const template = await createProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: proposalCategory.id
    });

    const adminCookie = await loginUser(adminUser.id);

    const body = (
      await request(baseUrl).put(`/api/pages/${template.id}`).set('Cookie', adminCookie).send(updateContent).expect(200)
    ).body as IPageWithPermissions;
  });

  it('should to fail update proposal template page content if the user is not a space admin and respond 401', async () => {
    const { user: nonAdminUser, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const template = await createProposalTemplate({
      spaceId: space.id,
      userId: nonAdminUser.id,
      categoryId: proposalCategory.id
    });

    const adminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl).put(`/api/pages/${template.id}`).set('Cookie', adminCookie).send(updateContent).expect(401);
  });
});
