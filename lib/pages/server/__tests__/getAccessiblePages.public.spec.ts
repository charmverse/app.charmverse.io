import { testUtilsUser } from '@charmverse/core';

import { createPage, generateUserAndSpace, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getAccessiblePages } from '../getAccessiblePages';

describe('getAccessiblePages - public space', () => {
  it('Should return all pages for the space is a public space', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    // Page without any permission
    const page1 = await createPage({ createdBy: adminUser.id, spaceId: space.id });
    const page2 = await createPage({ createdBy: adminUser.id, spaceId: space.id });

    const pages = await getAccessiblePages({
      userId: undefined,
      spaceId: space.id
    });

    expect(pages.length).toBe(2);

    expect(pages.some((page) => page.id === page1.id)).toBe(true);
    expect(pages.some((page) => page.id === page2.id)).toBe(true);
  });
  it('should return only pages marked as deletedAt when user requests archived pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    const page1 = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });
    const page2 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date()
    });

    const softDeletedPages = await getAccessiblePages({
      userId: undefined,
      spaceId: space.id,
      archived: true
    });

    expect(softDeletedPages.length).toBe(1);
    expect(softDeletedPages[0].id).toBe(page2.id);
  });

  it('Should return a page based on a title match', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    // Page without any permission
    const pageWithoutMatch = await createPage({ createdBy: user.id, spaceId: space.id, title: 'First' });
    const pageToFind = await createPage({ createdBy: user.id, spaceId: space.id, title: 'Second' });

    const pages = await getAccessiblePages({
      userId: undefined,
      spaceId: space.id,
      search: 'sec'
    });

    expect(pages.length).toBe(1);
    expect(pages[0].id).toBe(pageToFind.id);
  });
});

describe('getAccessiblePages - public space search', () => {
  it('should return a page based on a title match', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    // Page without any permission
    const pageWithoutMatch = await createPage({ createdBy: user.id, spaceId: space.id, title: 'First' });
    const pageToFind = await createPage({ createdBy: user.id, spaceId: space.id, title: 'Second' });

    const pages = await getAccessiblePages({
      userId: undefined,
      spaceId: space.id,
      search: 'sec'
    });

    expect(pages.length).toBe(1);
    expect(pages[0].id).toBe(pageToFind.id);
  });

  it('should return a page when keywords are not adjacent', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    // Page without any permission
    const pageWithoutMatch = await createPage({ createdBy: user.id, spaceId: space.id, title: 'First' });
    const pageToFind = await createPage({ createdBy: user.id, spaceId: space.id, title: 'one two three' });

    const pages = await getAccessiblePages({
      userId: undefined,
      spaceId: space.id,
      search: 'on thr'
    });

    expect(pages.length).toBe(1);
    expect(pages[0].id).toBe(pageToFind.id);
  });
});
