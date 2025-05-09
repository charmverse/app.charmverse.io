import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { getSpaceAdditionalBlockCount } from '../getSpaceAdditionalBlockCount';

describe('getSpaceAdditionalBlockCount', () => {
  it('should return total additional block counts for the space considering the expiration date', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    await prisma.additionalBlockQuota.create({
      data: {
        blockCount: 10,
        // expiration is 1 day before
        expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        spaceId: space.id
      }
    });

    await prisma.additionalBlockQuota.create({
      data: {
        blockCount: 20,
        // expiration is 1 day after
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        spaceId: space.id
      }
    });

    await prisma.additionalBlockQuota.create({
      data: {
        blockCount: 30,
        spaceId: space.id
      }
    });

    const additionalBlockCount = await getSpaceAdditionalBlockCount({
      spaceId: space.id
    });

    expect(additionalBlockCount).toEqual(50);
  });

  it('should return 0 for a space without any additional block counts', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();
    const additionalBlockCount = await getSpaceAdditionalBlockCount({
      spaceId: space.id
    });
    expect(additionalBlockCount).toEqual(0);
  });
});
