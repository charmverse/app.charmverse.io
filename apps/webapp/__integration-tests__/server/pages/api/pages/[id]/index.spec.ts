/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Page, Space, User } from '@charmverse/core/prisma';
import { testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import type { PageWithPermissions } from '@packages/core/pages';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import { getPage } from 'lib/pages/server';

describe('PUT /api/pages/{id} - update page', () => {
  const updateContent = {
    content: {
      paragraph: 'This is a paragraph'
    }
  };
  let adminUser: User;
  let normalMember: User;
  let space: Space;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    adminUser = generated.user;
    space = generated.space;
    normalMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
  });

  it('should allow user with permissions to update the page content, title, header image, and icon', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    const userCookie = await loginUser(normalMember.id);

    const pageUpdate: Pick<Page, 'title' | 'headerImage' | 'icon' | 'content' | 'contentText'> = {
      content: { paragraph: 'This is a paragraph' },
      contentText: 'This is a paragraph',
      headerImage: 'https://example.com/image.png',
      icon: 'https://example.com/icon.png',
      title: 'new title'
    };

    await request(baseUrl).put(`/api/pages/${page.id}`).set('Cookie', userCookie).send(pageUpdate).expect(200);

    const updatedPage = await getPage(page.id);

    expect(updatedPage).toMatchObject(expect.objectContaining(pageUpdate));
  });

  // This is a temporary test, until we get a more fine grained way to evaluate diffs received in content field
  it('should not allow user with view_comment permission or less to update any other field than the page content', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'view_comment',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });
    const userCookie = await loginUser(normalMember.id);
    // This isn't the exact shape of a comment mark, but it's enough to test the functionality
    const commentUpdate: Pick<Page, 'content' | 'contentText'> = {
      content: { paragraph: 'This is a paragraph', marks: ['commentMark'] },
      contentText: 'This is a paragraph [commentMark]'
    };

    await request(baseUrl).put(`/api/pages/${page.id}`).set('Cookie', userCookie).send(commentUpdate).expect(200);
    const updatedPage = await getPage(page.id);
    expect(updatedPage).toMatchObject(expect.objectContaining(commentUpdate));

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
    const template = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageType: 'proposal_template'
    });

    const adminCookie = await loginUser(adminUser.id);

    const body = (
      await request(baseUrl)
        .put(`/api/pages/${template.page.id}`)
        .set('Cookie', adminCookie)
        .send(updateContent)
        .expect(200)
    ).body as PageWithPermissions;
  });

  it('should to fail update proposal template page content if the user is not a space admin and respond 401', async () => {
    const template = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageType: 'proposal_template'
    });

    const memberCookie = await loginUser(normalMember.id);

    await request(baseUrl)
      .put(`/api/pages/${template.page.id}`)
      .set('Cookie', memberCookie)
      .send(updateContent)
      .expect(401);
  });
});

describe('GET /api/pages/{id} - get page', () => {
  let adminUser: User;
  let normalMember: User;
  let space: Space;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    adminUser = generated.user;
    space = generated.space;
    normalMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
  });

  it('should return a page to a user with permission to access it and respond 200', async () => {
    const { createdAt, updatedAt, content, ...page } = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      pagePermissions: [
        {
          assignee: { group: 'space', id: space.id },
          permissionLevel: 'editor'
        }
      ]
    });
    const userCookie = await loginUser(normalMember.id);
    const receivedPage = (await request(baseUrl).get(`/api/pages/${page.id}`).set('Cookie', userCookie).expect(200))
      .body;

    expect(receivedPage).toMatchObject(expect.objectContaining(page));
  });

  it('should support queries by page path and space domain for a user with permission to access the page and respond 200', async () => {
    const { createdAt, updatedAt, content, ...page } = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      pagePermissions: [
        {
          assignee: { group: 'space', id: space.id },
          permissionLevel: 'editor'
        }
      ]
    });
    const userCookie = await loginUser(normalMember.id);

    const receivedPage = (
      await request(baseUrl).get(`/api/pages/${page.path}?spaceId=${space.id}`).set('Cookie', userCookie).expect(200)
    ).body;

    const receivedPage2 = (
      await request(baseUrl)
        .get(`/api/pages/${page.path}?spaceId=${space.domain}`)
        .set('Cookie', userCookie)
        .expect(200)
    ).body;

    expect(receivedPage).toMatchObject(expect.objectContaining(page));
    expect(receivedPage2).toMatchObject(expect.objectContaining(page));
  });

  // This is a temporary test, until we get a more fine grained way to evaluate diffs received in content field
  it('should not allow user without permissions to view the page', async () => {
    // Created by admin, only visible by them as no permissions exist
    const { createdAt, updatedAt, ...page } = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id
    });
    const userCookie = await loginUser(normalMember.id);
    await request(baseUrl).get(`/api/pages/${page.id}`).set('Cookie', userCookie).expect(401);
  });
});
