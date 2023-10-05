import type { Post } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';

import { paginatedPrismaTask } from '../paginatedPrismaTask';
import { randomIntFromInterval } from '../random';

describe('paginatedPrismaTask', () => {
  it('should perform a task and return results', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const category = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const records = 100;
    const batchSize = 10;

    const array = Array.from({ length: records }, (_, i) => i.toString());

    const posts = await prisma.post.createMany({
      data: array.map((item) => ({
        categoryId: category.id,
        content: {},
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
        select: {
          id: true
        }
      },
      callback: async (results: Post[]) => {
        return results.map((r) => r.title);
      }
    });

    console.log(paginatedTaskResults);

    expect(paginatedTaskResults).toHaveLength(batchSize);
  });
});
