import { InvalidInputError } from '@charmverse/core/errors';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { stringUtils } from '@charmverse/core/utilities';

import { createPage } from 'testing/setupDatabase';

import { getAccessiblePages } from '../getAccessiblePages';

describe('getAccessiblePages - public space', () => {
  it('Should return all pages for the space', async () => {
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

  it('should parse the limit if it was passed as a string', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const pages = await Promise.all([
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id }),
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id }),
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id })
    ]);

    const foundPages1 = await getAccessiblePages({
      spaceId: space.id,
      userId: user.id,
      limit: '2' as any
    });

    expect(foundPages1).toHaveLength(2);

    const foundPages2 = await getAccessiblePages({
      spaceId: space.id,
      userId: user.id,
      // Empty string should be treated as undefined
      limit: '' as any
    });

    expect(foundPages2).toHaveLength(pages.length);

    const foundPages3 = await getAccessiblePages({
      spaceId: space.id,
      userId: user.id,
      // Invalid string evals to NaN and should be treated as undefined
      limit: 'invalid' as any
    });

    expect(foundPages3).toHaveLength(pages.length);
  });

  it('should throw an error if no space ID is provided', async () => {
    await expect(getAccessiblePages({ spaceId: undefined as any })).rejects.toBeInstanceOf(InvalidInputError);
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

  it('Should return a page based on a match on nested content', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    // Page without any permission
    const pageToFind = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Searched page',
      contentText: 'Specific content'
    });

    const pages = await getAccessiblePages({ userId: user.id, spaceId: space.id, search: 'Specific' });
    expect(pages.map((p) => p.id)).toEqual([pageToFind.id]);
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

  it('should handle special tsquery characters', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const tsQuerySpecialCharsList = stringUtils.tsQueryLanguageCharacters();

    const pageToFind = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: `Special ${tsQuerySpecialCharsList.join('')} page`
    });

    const pageWithoutMatch = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'No match'
    });

    for (const char of tsQuerySpecialCharsList) {
      // eslint-disable-next-line prettier/prettier, no-useless-escape
    const pages = await getAccessiblePages({ userId: user.id, spaceId: space.id, search: `special ${ char } page` });
      expect(pages).toHaveLength(1);
      expect(pages[0].id).toBe(pageToFind.id);
    }
  });
});
