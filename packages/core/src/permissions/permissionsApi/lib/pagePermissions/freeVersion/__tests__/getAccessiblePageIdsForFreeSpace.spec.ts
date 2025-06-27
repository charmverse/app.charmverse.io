import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

import { getAccessiblePageIdsForFreeSpace } from '../getAccessiblePageIdsForFreeSpace';

describe('getAccessiblePageIdsForFreeSpace - public space', () => {
  it('Should return all pages for the space', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    // Page without any permission
    const page1 = await testUtilsPages.generatePage({ createdBy: adminUser.id, spaceId: space.id });
    const page2 = await testUtilsPages.generatePage({ createdBy: adminUser.id, spaceId: space.id });

    const pages = await getAccessiblePageIdsForFreeSpace({
      userId: undefined,
      spaceId: space.id
    });

    expect(pages).toHaveLength(2);

    expect(pages).toMatchObject(expect.arrayContaining([page1.id, page2.id]));
  });
  it('should return only pages marked as deletedAt when user requests archived pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    const page1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    const page2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date()
    });

    const softDeletedPages = await getAccessiblePageIdsForFreeSpace({
      userId: undefined,
      spaceId: space.id,
      archived: true
    });

    expect(softDeletedPages).toEqual([page2.id]);
  });

  it('should parse the limit if it was passed as a string', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const pages = await Promise.all([
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id }),
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id }),
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id })
    ]);

    const foundPages1 = await getAccessiblePageIdsForFreeSpace({
      spaceId: space.id,
      userId: user.id,
      limit: '2' as any
    });

    expect(foundPages1).toHaveLength(2);

    const foundPages2 = await getAccessiblePageIdsForFreeSpace({
      spaceId: space.id,
      userId: user.id,
      // Empty string should be treated as undefined
      limit: '' as any
    });

    expect(foundPages2).toHaveLength(pages.length);

    const foundPages3 = await getAccessiblePageIdsForFreeSpace({
      spaceId: space.id,
      userId: user.id,
      // Invalid string evals to NaN and should be treated as undefined
      limit: 'invalid' as any
    });

    expect(foundPages3).toHaveLength(pages.length);
  });

  it('should throw an error if no space ID is provided', async () => {
    await expect(getAccessiblePageIdsForFreeSpace({ spaceId: undefined as any })).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });
});

describe('getAccessiblePageIdsForFreeSpace - public space search', () => {
  it('should return a page based on a title match', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    // Page without any permission
    const pageWithoutMatch = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'First'
    });
    const pageToFind = await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id, title: 'Second' });

    const pages = await getAccessiblePageIdsForFreeSpace({
      userId: undefined,
      spaceId: space.id,
      search: 'sec'
    });
    expect(pages).toEqual([pageToFind.id]);
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

    const pages = await getAccessiblePageIdsForFreeSpace({ userId: user.id, spaceId: space.id, search: 'Specific' });
    expect(pages).toEqual([pageToFind.id]);
  });

  it('should return a page when keywords are not adjacent', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    // Page without any permission
    const pageWithoutMatch = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'First'
    });
    const pageToFind = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'one two three'
    });

    const pages = await getAccessiblePageIdsForFreeSpace({
      userId: undefined,
      spaceId: space.id,
      search: 'on thr'
    });

    expect(pages).toEqual([pageToFind.id]);
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
      const pages = await getAccessiblePageIdsForFreeSpace({
        userId: user.id,
        spaceId: space.id,
        search: `special ${char} page`
      });
      expect(pages).toEqual([pageToFind.id]);
    }
  });
});
