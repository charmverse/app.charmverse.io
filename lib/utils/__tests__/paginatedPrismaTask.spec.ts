import { Prisma } from '@charmverse/core/prisma';
import type { Post } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import { arrayUtils } from '@charmverse/core/utilities';

import { randomIntFromInterval } from '../../../packages/utils/src/random';
import { paginatedPrismaTask } from '../paginatedPrismaTask';

describe('paginatedPrismaTask', () => {
  it('should perform a task and return results', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const category = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const records = 100;
    const batchSize = 20;

    const array = Array.from({ length: records }, (_, i) => i.toString());

    const posts = await prisma.post.createMany({
      data: array.map((item) => ({
        categoryId: category.id,
        content: Prisma.JsonNull,
        contentText: '',
        createdBy: user.id,
        path: `post-${randomIntFromInterval(10000000, 90000000)}`,
        spaceId: space.id,
        title: `test post ${item}`
      }))
    });

    const paginatedTaskResults = await paginatedPrismaTask({
      model: 'post',
      batchSize,
      queryOptions: {
        where: {
          spaceId: space.id
        },
        select: {
          id: true,
          title: true
        }
      },
      mapper: async (result: Post) => {
        return result.id;
      }
    });

    // Make sure we do not have any duplicates during pagination
    expect(arrayUtils.uniqueValues(paginatedTaskResults).length).toEqual(records);

    expect(paginatedTaskResults).toHaveLength(records);
  });

  it('should take an optional onSuccess function which rolls up the results', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const category = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const records = 10;
    const batchSize = 5;

    const array = Array.from({ length: records }, (_, i) => i.toString());

    const posts = await prisma.post.createMany({
      data: array.map((item) => ({
        categoryId: category.id,
        content: Prisma.JsonNull,
        contentText: '',
        createdBy: user.id,
        path: `post-${randomIntFromInterval(1000000, 90000000)}`,
        spaceId: space.id,
        title: `test post ${item}`
      }))
    });

    const paginatedTaskResults = await paginatedPrismaTask({
      model: 'post',
      batchSize,
      queryOptions: {
        where: {
          spaceId: space.id
        },
        select: {
          id: true,
          title: true
        }
      },
      mapper: async (result: Post) => {
        return result.id;
      },
      onSuccess: (values: string[]) => values.length
    });

    expect(paginatedTaskResults).toEqual(records);
  });
});
