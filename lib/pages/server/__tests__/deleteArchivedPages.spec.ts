import { prisma } from '@charmverse/core/prisma-client';
import { createBlock, createPage } from '@packages/testing/setupDatabase';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { deleteArchivedPages } from '../deleteArchivedPages';

describe('deleteArchivedPages', () => {
  it('Should delete the archived pages older than 30 days', async () => {
    const space = await prisma.space.findFirst();
    const user = await prisma.user.findFirst();
    if (space && user) {
      // A page archived just now
      const firstPage = await createPage({
        spaceId: space.id,
        createdBy: user.id,
        deletedAt: new Date()
      });

      // A page not archived
      const secondPage = await createPage({
        spaceId: space.id,
        createdBy: user.id
      });

      // A page archived 30 days ago
      const thirdPage = await createPage({
        spaceId: space.id,
        createdBy: user.id,
        deletedAt: new Date(
          DateTime.now()
            .minus({
              days: 31
            })
            .toISO()
        )
      });

      // A block archived just now
      const firstBlock = await createBlock({
        spaceId: space.id,
        createdBy: user.id,
        deletedAt: new Date(),
        rootId: v4()
      });

      // A block not archived
      const secondBlock = await createBlock({
        spaceId: space.id,
        createdBy: user.id,
        rootId: v4()
      });

      // A block archived 30 days ago
      const thirdBlock = await createBlock({
        spaceId: space.id,
        createdBy: user.id,
        deletedAt: new Date(
          DateTime.now()
            .minus({
              days: 31
            })
            .toISO()
        ),
        rootId: v4()
      });

      const { deletedBlocksCount, deletedPagesCount } = await deleteArchivedPages(30);
      expect(deletedBlocksCount).toBe(1);
      expect(deletedPagesCount).toBe(1);

      const pages = await prisma.page.findMany({
        where: {
          id: {
            in: [firstPage.id, secondPage.id, thirdPage.id]
          }
        },
        select: {
          id: true
        }
      });

      const blocks = await prisma.block.findMany({
        where: {
          id: {
            in: [firstBlock.id, secondBlock.id, thirdBlock.id]
          }
        },
        select: {
          id: true
        }
      });

      const pageIds = new Set(pages.map((page) => page.id));
      const blockIds = new Set(blocks.map((block) => block.id));

      expect(pageIds.size).toBe(2);
      expect(blockIds.size).toBe(2);
      expect([firstPage.id, secondPage.id].every((pageId) => pageIds.has(pageId))).toBe(true);
      expect([firstBlock.id, secondBlock.id].every((blockId) => blockIds.has(blockId))).toBe(true);
    }
  });
});
