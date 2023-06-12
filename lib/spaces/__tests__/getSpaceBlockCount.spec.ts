import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';

import type { BlockCountInfo } from '../getSpaceBlockCount';
import { getSpaceBlockCount } from '../getSpaceBlockCount';

describe('getSpaceBlockCount', () => {
  it('should return the most recent block count for the space along with its details', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const blockCount = await prisma.blockCount.create({
      data: {
        details: {},
        count: 10,
        space: { connect: { id: space.id } }
      }
    });

    const secondBlockCount = await prisma.blockCount.create({
      data: {
        details: {},
        count: 20,
        space: { connect: { id: space.id } }
      }
    });

    const thirdBlockCount = await prisma.blockCount.create({
      data: {
        details: {
          pages: 30
        },
        count: 30,
        space: { connect: { id: space.id } }
      }
    });

    const latestCount = await getSpaceBlockCount({
      spaceId: space.id
    });

    expect(latestCount.count).toEqual(30);
    expect(latestCount.details).toEqual({ pages: 30 });
  });

  it('should generate a block count for the space if it does not exist', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    await testUtilsForum.generatePostCategory({ spaceId: space.id });

    const counts = await prisma.blockCount.count({
      where: {
        spaceId: space.id
      }
    });

    expect(counts).toEqual(0);

    const blockCount = await getSpaceBlockCount({ spaceId: space.id });

    expect(blockCount).toMatchObject<BlockCountInfo>({
      count: 1,
      createdAt: expect.any(Date),
      details: expect.any(Object)
    });

    const countsAfterGetter = await prisma.blockCount.count({
      where: {
        spaceId: space.id
      }
    });
    expect(countsAfterGetter).toEqual(1);
  });
});
