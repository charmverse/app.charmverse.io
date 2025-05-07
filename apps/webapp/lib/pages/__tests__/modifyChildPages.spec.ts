import type { Block, Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBoard } from '@packages/testing/setupDatabase';
import { v4 as uuid } from 'uuid';

import { trashOrDeletePage } from '../trashOrDeletePage';

describe('trashOrDeletePage', () => {
  test('should delete child pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

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

    const deletedChildPageIds = await trashOrDeletePage(board.id, user.id, 'delete');

    expect(deletedChildPageIds.length === pages.length).toBeTruthy();
  });

  test('should delete notifications for card pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const board = await generateBoard({ createdBy: user.id, spaceId: space.id, cardCount: 5 });

    const [pages, blocks] = await Promise.all([
      prisma.page.findMany({
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
      }),
      prisma.block.findMany({
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
      })
    ]);

    const cardPage = pages.find((p) => p.type === 'card') as Page;
    const cardBlock = blocks.find((b) => b.type === 'card') as Block;

    const cardNotification = await prisma.cardNotification.create({
      data: {
        id: uuid(),
        type: 'person_assigned',
        personPropertyId: uuid(),
        card: {
          connect: {
            id: cardBlock.id
          }
        },
        notificationMetadata: {
          create: {
            seenAt: new Date(),
            archivedAt: new Date(),
            spaceId: space.id,
            createdAt: new Date(),
            userId: space.createdBy,
            createdBy: space.createdBy
          }
        }
      }
    });

    const deletedChildPageIds = await trashOrDeletePage(board.id, user.id, 'delete');

    const cardNotificationAfterDelete = await prisma.cardNotification.findUnique({
      where: {
        id: cardNotification.id
      }
    });

    expect(cardNotificationAfterDelete).toBeNull();
  });

  test('should archive child pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const board = await generateBoard({ createdBy: user.id, spaceId: space.id });

    const archivedChildPageIds = await trashOrDeletePage(board.id, user.id, 'trash');

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
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const board = await generateBoard({ createdBy: user.id, spaceId: space.id });

    await trashOrDeletePage(board.id, user.id, 'trash');
    const restoredChildPageIds = await trashOrDeletePage(board.id, user.id, 'restore');

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
