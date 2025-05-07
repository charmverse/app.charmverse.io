import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { deleteArchivalBlockCounts } from 'lib/spaces/deleteArchivalBlockCounts';

describe('deleteArchivalBlockCounts', () => {
  it('should remove block count entries older than 7 days', async () => {
    const { space } = await generateUserAndSpace();

    await prisma.blockCount.create({
      data: {
        count: 20,
        details: {},
        createdAt: new Date(),
        space: { connect: { id: space.id } }
      }
    });

    await prisma.blockCount.create({
      data: {
        count: 10,
        details: {},
        // 1 day old
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        space: { connect: { id: space.id } }
      }
    });

    await prisma.blockCount.create({
      data: {
        count: 30,
        details: {},
        // 8 days old
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        space: { connect: { id: space.id } }
      }
    });

    await deleteArchivalBlockCounts();

    const blockCounts = await prisma.blockCount.findMany({
      where: {
        spaceId: space.id
      }
    });

    expect(blockCounts).toHaveLength(2);
  });
});
