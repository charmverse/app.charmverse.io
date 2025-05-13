import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { trashOrDeletePage } from '@packages/pages/trashOrDeletePage';

// write a test to check if the trashOrDeletePage function is working as expected
describe('trashOrDeletePage', () => {
  it('should delete a page when the action is delete', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    const syncedPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      syncWithPageId: page.id
    });

    await trashOrDeletePage(page.id, user.id, 'delete');

    const _page = await prisma.page.findUnique({
      where: {
        id: page.id
      }
    });
    expect(_page).toBeNull();
    const _syncedPage = await prisma.page.findUnique({
      where: {
        id: syncedPage.id
      }
    });
    expect(_syncedPage).toBeNull();
  });

  it('should set deletedAt when the action is trashed', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    const syncedPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      syncWithPageId: page.id
    });

    await trashOrDeletePage(page.id, user.id, 'trash');

    const _page = await prisma.page.findUnique({
      where: {
        id: page.id
      }
    });
    expect(_page).toBeTruthy();
    expect(_page?.deletedAt).toBeTruthy();
    const _syncedPage = await prisma.page.findUnique({
      where: {
        id: syncedPage.id
      }
    });
    expect(_syncedPage).toBeTruthy();
    expect(_syncedPage?.deletedAt).toBeTruthy();
  });

  it('should unset deletedAt when the action is restored', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date()
    });
    const syncedPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date(),
      syncWithPageId: page.id
    });

    await trashOrDeletePage(page.id, user.id, 'restore');

    const _page = await prisma.page.findUnique({
      where: {
        id: page.id
      }
    });
    expect(_page).toBeTruthy();
    expect(_page?.deletedAt).toBeNull();
    const _syncedPage = await prisma.page.findUnique({
      where: {
        id: syncedPage.id
      }
    });
    expect(_syncedPage).toBeTruthy();
    expect(_syncedPage?.deletedAt).toBeNull();
  });
});
