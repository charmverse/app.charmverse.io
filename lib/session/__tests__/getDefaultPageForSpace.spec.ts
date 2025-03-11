import type { UserSpaceAction } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { createPage, createPost, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';

import { getDefaultPageForSpace } from '../getDefaultPageForSpace';

describe('getDefaultPageForSpace()', () => {
  it('should send user to first top-level page by default', async () => {
    const { space, user } = await generateUserAndSpace();
    await createPage({
      createdAt: new Date(),
      index: 2,
      path: 'second-page',
      spaceId: space.id,
      createdBy: user.id,
      // add basic permission
      pagePermissions: [{ permissionLevel: 'view', spaceId: space.id }]
    });
    // create a page that is first based on index
    const page = await createPage({
      createdAt: new Date(Date.now() + 100000),
      index: 1,
      spaceId: space.id,
      path: 'first-page',
      createdBy: user.id,
      // add basic permission
      pagePermissions: [{ permissionLevel: 'view', spaceId: space.id }]
    });

    // child page with lower index
    await createPage({
      createdAt: new Date(),
      index: 0,
      spaceId: space.id,
      path: 'child-page',
      createdBy: user.id,
      // add basic permission
      pagePermissions: [{ permissionLevel: 'view', spaceId: space.id }],
      parentId: page.id
    });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/${page.path}`);
  });

  it('should send user to /members page when no other pages are available', async () => {
    const { space, user } = await generateUserAndSpace();

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/members`);
  });
  it('should send user to last visited static page', async () => {
    const { space, user } = await generateUserAndSpace();
    await savePageView({ createdBy: user.id, spaceId: space.id, pageType: 'forum_posts_list' });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/forum`);
  });

  it('should send user to home page if one is set, even if there is a last page view', async () => {
    const { space, user } = await generateUserAndSpace();
    await createPage({
      spaceId: space.id,
      createdBy: user.id,
      index: 1,
      // add basic permission
      pagePermissions: [{ permissionLevel: 'view', spaceId: space.id }]
    });
    await savePageView({ createdBy: user.id, spaceId: space.id, pageType: 'forum_posts_list' });
    const homePage = await createPage({
      spaceId: space.id,
      createdBy: user.id,
      index: 2,
      // add basic permission
      pagePermissions: [{ permissionLevel: 'view', spaceId: space.id }]
    });
    const updated = await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        homePageId: homePage.id
      }
    });
    const url = await getDefaultPageForSpace({ space: updated, userId: user.id });
    expect(url).toEqual(`/${space.domain}/${homePage.path}`);
  });

  it('should send user to last visited document page', async () => {
    const { space, user } = await generateUserAndSpace();
    const page = await createPage({ spaceId: space.id, createdBy: user.id });
    await savePageView({ createdBy: user.id, spaceId: space.id, pageId: page.id, pageType: 'page' });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/${page.path}`);
  });

  it('should send user to last visited forum post page', async () => {
    const { space, user } = await generateUserAndSpace();
    const category = await generatePostCategory({ spaceId: space.id });
    const post = await createPost({ spaceId: space.id, categoryId: category.id, createdBy: user.id });
    await savePageView({ createdBy: user.id, spaceId: space.id, postId: post.id, pageType: 'post' });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/forum/post/${post.path}`);
  });

  it('should encode Japanese characters', async () => {
    const { space, user } = await generateUserAndSpace();
    const page = await createPage({ spaceId: space.id, createdBy: user.id, path: '日本語' });
    await savePageView({ createdBy: user.id, spaceId: space.id, pageId: page.id, pageType: 'page' });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(encodeURI(`/${space.domain}/${page.path}`));
  });

  it('should not re-encode encoded characters in the original path', async () => {
    const { space, user } = await generateUserAndSpace();
    const page = await createPage({ spaceId: space.id, createdBy: user.id });
    await savePageView({
      createdBy: user.id,
      spaceId: space.id,
      pageId: page.id,
      pageType: 'page',
      meta: { pathname: `/${page.path}%20?id=123` }
    });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/${page.path}%20?id=123`);
  });

  it('should not include subdomain when visiting custom domain', async () => {
    const customDomain = 'work.charmverse.fyi';
    const { space, user } = await generateUserAndSpace({
      spaceCustomDomain: customDomain
    });
    await savePageView({
      createdBy: user.id,
      spaceId: space.id,
      pageType: 'proposals_list',
      meta: { pathname: `/proposals%20?id=123` }
    });

    const url = await getDefaultPageForSpace({ space, userId: user.id, host: customDomain });
    expect(url).toEqual(`/proposals%20?id=123`);
  });

  it('should take user to the canonical page if it was displayed in a card originally', async () => {
    const { space, user } = await generateUserAndSpace();
    const page = await createPage({ spaceId: space.id, createdBy: user.id });
    await savePageView({
      createdBy: user.id,
      spaceId: space.id,
      pageId: page.id,
      pageType: 'page',
      meta: { pathname: `/parent-database-path?cardId=${page.id}` }
    });
    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/${page.path}`);
  });
});

describe('getDefaultPageForSpace - non logged in user', () => {
  it('should return the home page if it is public', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const publicHomePage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [{ permissionLevel: 'view', assignee: { group: 'public' } }]
    });

    const updatedSpace = await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        homePageId: publicHomePage.id
      }
    });

    const redirect = await getDefaultPageForSpace({ space: updatedSpace, userId: undefined });

    expect(redirect).toEqual(`/${space.domain}/${publicHomePage.path}`);
  });

  it('should return the join page if the home page is not public', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const publicHomePage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const updatedSpace = await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        homePageId: publicHomePage.id
      }
    });

    const redirect = await getDefaultPageForSpace({ space: updatedSpace, userId: undefined });

    expect(redirect).toEqual(null);
  });

  it('should return the join page if there is no home page', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const redirect = await getDefaultPageForSpace({ space, userId: undefined });

    expect(redirect).toEqual(null);
  });

  it('should return main custom domain page (login) if there is no homepage', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const updatedSpace = await prisma.space.update({
      where: { id: space.id },
      data: { customDomain: 'test.charm.fyi' }
    });

    const redirect = await getDefaultPageForSpace({ space: updatedSpace, userId: undefined, host: 'test.charm.fyi' });

    expect(redirect).toEqual(null);
  });
});

type EventData = Pick<UserSpaceAction, 'pageType' | 'createdBy' | 'spaceId'> & {
  pageId?: string;
  postId?: string;
  meta?: any;
};

function savePageView(event: EventData) {
  return prisma.userSpaceAction.create({
    data: {
      action: 'view_page',
      ...event
    }
  });
}
