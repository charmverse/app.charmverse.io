import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { countAllSpacesBlocksTask } from '../countAllSpacesBlocksTask';

describe('countAllSpacesBlocksTask', () => {
  it('should count blocks for all spaces', async () => {
    const blockCounts = await prisma.blockCount.count();

    const spacesWithBlocks = 5;

    for (let i = 0; i < spacesWithBlocks; i++) {
      await testUtilsUser.generateUserAndSpace();
    }

    await countAllSpacesBlocksTask();

    const secondBlockCounts = await prisma.blockCount.count();

    expect(secondBlockCounts).toBeGreaterThanOrEqual(blockCounts + spacesWithBlocks);
  });
});
