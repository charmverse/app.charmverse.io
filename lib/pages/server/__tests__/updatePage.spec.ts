import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';

import { generatePagePathFromPathAndTitle, getPagePath } from '../../../../packages/pages/src/utils';
import { updatePage } from '../updatePage';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('updatePage', () => {
  it('should update a simple property', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const result = await updatePage(page, page.createdBy, { icon: 'some-icon' });

    expect(result.icon).toEqual('some-icon');
  });

  it('should include page title as part of the page path', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      path: getPagePath(),
      spaceId: space.id
    });

    const newTitle = 'Hakkunah Matata';
    const result = await updatePage(page, page.createdBy, { title: newTitle });

    const expectedPath = generatePagePathFromPathAndTitle({ title: newTitle, existingPagePath: page.path });

    expect(result.path).toEqual(expectedPath);
    expect(result.title).toEqual(newTitle);
  });

  it('should update pages that are synced with it', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const syncedPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      syncWithPageId: page.id
    });

    const newTitle = 'Hakkunah Matata';
    await updatePage(page, page.createdBy, { title: newTitle });

    const syncedPageUpdatd = await prisma.page.findUniqueOrThrow({
      where: {
        id: syncedPage.id
      }
    });
    expect(syncedPageUpdatd.title).toEqual(newTitle);
  });
});
