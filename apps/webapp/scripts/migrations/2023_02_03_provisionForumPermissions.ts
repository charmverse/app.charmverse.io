import { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

const concurrent = 5;

async function provisionForumPermissions() {
  let remainingSpaces = await prisma.space.count({
    where: {
      postCategoryPermissions: {
        none: {}
      }
    }
  });

  console.log('Spaces to processs:', remainingSpaces);

  for (let i = 0; i < remainingSpaces; i++) {
    const spaces = await prisma.space.findMany({
      skip: i,
      take: concurrent,
      where: {
        postCategoryPermissions: {
          none: {}
        }
      },
      select: {
        id: true,
        postCategories: true
      }
    });

    await prisma.$transaction(
      spaces.map((space) =>
        prisma.postCategoryPermission.createMany({
          data: space.postCategories.map(
            (category) =>
              ({
                permissionLevel: 'full_access',
                postCategoryId: category.id,
                spaceId: space.id
              }) as Prisma.PostCategoryPermissionCreateManyInput
          )
        })
      )
    );

    console.log(`Processed spaces`, i + 1, '-', i + spaces.length, ' / ', remainingSpaces);
  }

  const spaces = await prisma.space.findMany({});
}
