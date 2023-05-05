import { prisma } from '@charmverse/core';

import { generateBoard, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { modifyChildPages } from '../modifyChildPages';

describe('modifyChildPages', () => {
  test('should delete child pages', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const board = await generateBoard({ createdBy: user.id, spaceId: space.id });

    const pages = await prisma.page.findMany({
      where: {
        spaceId: space.id,
        OR: [
          {
            id: board.id
          },
          {
            parentId: board.id
          }
        ]
      },
      select: {
        id: true,
        parentId: true,
        type: true
      }
    });

    const deletedChildPageIds = await modifyChildPages(board.id, user.id, 'delete');

    expect(deletedChildPageIds.length === pages.length).toBeTruthy();
  });

  test('should archive child pages', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const board = await generateBoard({ createdBy: user.id, spaceId: space.id });

    const archivedChildPageIds = await modifyChildPages(board.id, user.id, 'archive');

    const archivedPages = await prisma.page.findMany({
      where: {
        spaceId: space.id,
        OR: [
          {
            id: board.id
          },
          {
            parentId: board.id
          }
        ]
      },
      select: {
        id: true,
        parentId: true,
        type: true,
        deletedAt: true
      }
    });

    expect(archivedPages.every((p) => !!p.deletedAt)).toBeTruthy();
    expect(archivedPages.every((p) => archivedChildPageIds.includes(p.id))).toBeTruthy();
  });

  test('should restore child pages', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const board = await generateBoard({ createdBy: user.id, spaceId: space.id });

    await modifyChildPages(board.id, user.id, 'archive');
    const restoredChildPageIds = await modifyChildPages(board.id, user.id, 'restore');

    const restoredPages = await prisma.page.findMany({
      where: {
        spaceId: space.id,
        OR: [
          {
            id: board.id
          },
          {
            parentId: board.id
          }
        ]
      },
      select: {
        id: true,
        parentId: true,
        type: true,
        deletedAt: true
      }
    });

    expect(restoredPages.every((p) => p.deletedAt === null)).toBeTruthy();
    expect(restoredPages.every((p) => restoredChildPageIds.includes(p.id))).toBeTruthy();
  });
});
