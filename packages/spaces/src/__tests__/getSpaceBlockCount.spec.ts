import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';

import { getSpaceBlockCount } from '../getSpaceBlockCount';

describe('getSpaceBlockCount', () => {
  it('should return the most recent block count for the space along with its details', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    await prisma.blockCount.create({
      data: {
        details: {},
        count: 10,
        space: { connect: { id: space.id } }
      }
    });

    await prisma.blockCount.create({
      data: {
        details: {},
        count: 20,
        space: { connect: { id: space.id } }
      }
    });

    await prisma.blockCount.create({
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

  it('should throw an error if a block count for the space  does not exist', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    await testUtilsForum.generatePostCategory({ spaceId: space.id });

    await expect(getSpaceBlockCount({ spaceId: space.id })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
